import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { validate } from '@/middleware/validate'
import { requirePermission } from '@/middleware/rbac'
import { badRequest, notFound, ok, serverError } from '@/utils/response'
import { buildVigiLiveRtsp, buildVigiReplayRtsp } from '@/lib/vigiRtsp'

const router = Router()

const exportWindowSchema = z
  .object({
    start: z.string().min(4),
    end: z.string().min(4),
    stream: z.union([z.literal(1), z.literal(2)]).optional().default(1),
  })
  .refine((d) => !Number.isNaN(Date.parse(d.start)) && !Number.isNaN(Date.parse(d.end)), {
    message: 'start and end must be valid date strings',
  })

/**
 * GET /cameras/:cameraId/stream-urls
 * RTSP templates for VIGI NVR (live + instructions). Does not include credentials — VLC / client will prompt.
 */
router.get('/cameras/:cameraId/stream-urls', requirePermission('monitor.view'), async (req, res) => {
  try {
    const cam = await prisma.cameraDevice.findUnique({
      where: { id: req.params.cameraId },
      include: { vigiIntegration: true },
    })
    if (!cam) return notFound(res, 'Camera')

    const integration =
      cam.vigiIntegration ??
      (await prisma.vigiNvrIntegration.findUnique({ where: { branchId: cam.branchId } }))

    const rtspPort = 554

    if (cam.source === 'vigi' && integration && cam.vigiChannel != null) {
      const host = integration.host
      const ch = cam.vigiChannel
      const liveMain = buildVigiLiveRtsp(host, ch, 1, { rtspPort })
      const liveSub = buildVigiLiveRtsp(host, ch, 2, { rtspPort })
      const nvrHttpsUrl = `https://${host}:${integration.port}/`
      return ok(res, {
        mode: 'vigi' as const,
        branchId: cam.branchId,
        channel: ch,
        nvrHost: host,
        openApiPort: integration.port,
        nvrHttpsUrl,
        rtspPort,
        liveMain,
        liveSub,
        nvrWebUiHint: `NVR ${host}: OpenAPI HTTPS port ${integration.port}; RTSP (live/replay) port ${rtspPort}. Use the NVR web UI on your LAN for full playback UI. Browser may warn about self-signed TLS — continue on your LAN.`,
        storedRtspUrl: cam.rtspUrl,
        storedStreamUrl: cam.streamUrl,
        playbackNote:
          'Use POST /v1/assets/cameras/:id/export-window with start/end ISO times for full replay RTSP URL (VIGI format).',
      })
    }

    return ok(res, {
      mode: 'manual' as const,
      branchId: cam.branchId,
      liveRtsp: cam.rtspUrl,
      streamUrl: cam.streamUrl,
      hint:
        'Set stream URL or RTSP on the camera record, or connect a VIGI NVR integration and sync channels.',
    })
  } catch (err) {
    return serverError(res, err)
  }
})

/**
 * POST /cameras/:cameraId/export-window
 * Builds VIGI replay RTSP URL for a time range (export in VLC via Open Network Stream → record).
 */
router.post(
  '/cameras/:cameraId/export-window',
  requirePermission('monitor.view'),
  validate(exportWindowSchema),
  async (req, res) => {
    try {
      const cam = await prisma.cameraDevice.findUnique({
        where: { id: req.params.cameraId },
        include: { vigiIntegration: true },
      })
      if (!cam) return notFound(res, 'Camera')

      const integration =
        cam.vigiIntegration ??
        (await prisma.vigiNvrIntegration.findUnique({ where: { branchId: cam.branchId } }))

      if (!integration || cam.vigiChannel == null) {
        return badRequest(res, 'Replay URL requires a VIGI-linked camera with a channel number')
      }

      const { start, end, stream } = req.body as {
        start: string
        end: string
        stream?: 1 | 2
      }
      const startD = new Date(start)
      const endD = new Date(end)
      if (endD <= startD) return badRequest(res, 'end must be after start')

      const spanMs = endD.getTime() - startD.getTime()
      const maxWindowMs = 7 * 24 * 60 * 60 * 1000
      if (spanMs > maxWindowMs) {
        return badRequest(res, 'Time window cannot exceed 7 days')
      }

      const streamNum = (stream ?? 1) as 1 | 2
      const rtspPort = 554
      const replayRtsp = buildVigiReplayRtsp(
        integration.host,
        cam.vigiChannel,
        startD,
        endD,
        streamNum,
        { rtspPort },
      )

      const durationMin = Math.round((endD.getTime() - startD.getTime()) / 60_000)
      const safeLabel = cam.label.replace(/[^\w\-]+/g, '_').slice(0, 40)

      return ok(res, {
        replayRtsp,
        channel: cam.vigiChannel,
        nvrHost: integration.host,
        start: startD.toISOString(),
        end: endD.toISOString(),
        durationMinutes: durationMin,
        stream: streamNum,
        filenameSuggestion: `vigi_${safeLabel}_${formatCompact(startD)}_${formatCompact(endD)}.mp4`,
        exportHint:
          'Open this URL in VLC → Play. To save: Media → Convert / Save, or use VLC’s record feature. Ensure your PC can reach the NVR RTSP port (554) on the LAN or VPN.',
      })
    } catch (err) {
      return serverError(res, err)
    }
  },
)

function formatCompact(d: Date): string {
  return d.toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

export default router
