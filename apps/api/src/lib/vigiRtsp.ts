/**
 * TP-Link VIGI NVR RTSP URL shapes (RTSP server on NVR, default port 554).
 * @see https://www.tp-link.com/us/support/faq/4677/ — live & playback formats
 *
 * Live:   rtsp://{host}/live/ch{channel}/stream{1|2}/avm
 * Replay: rtsp://{host}/replay/ch{channel}/stream{1|2}/avm?starttime=...&endtime=...
 */

export function stripHost(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]!
    .split('@').pop()!
}

/** TP-Link-style time token: YYYYMMDDtHHMMSSz (UTC) */
export function formatVigiReplayTimeParam(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${day}t${h}${min}${s}z`
}

export function buildVigiLiveRtsp(
  nvrHost: string,
  channel: number,
  stream: 1 | 2 = 1,
  opts?: { rtspPort?: number },
): string {
  const host = stripHost(nvrHost)
  const port = opts?.rtspPort && opts.rtspPort !== 554 ? `:${opts.rtspPort}` : ''
  return `rtsp://${host}${port}/live/ch${channel}/stream${stream}/avm`
}

export function buildVigiReplayRtsp(
  nvrHost: string,
  channel: number,
  start: Date,
  end: Date,
  stream: 1 | 2 = 1,
  opts?: { rtspPort?: number },
): string {
  const host = stripHost(nvrHost)
  const port = opts?.rtspPort && opts.rtspPort !== 554 ? `:${opts.rtspPort}` : ''
  const qs = `starttime=${formatVigiReplayTimeParam(start)}&endtime=${formatVigiReplayTimeParam(end)}`
  return `rtsp://${host}${port}/replay/ch${channel}/stream${stream}/avm?${qs}`
}
