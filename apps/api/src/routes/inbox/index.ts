import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import prisma from "@/lib/prisma";
import { authenticate, requireStaff } from "@/middleware/auth";
import type { AuthRequest } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { getPagination, buildMeta } from "@/utils/pagination";
import {
  ok,
  created,
  notFound,
  forbidden,
  badRequest,
  serverError,
} from "@/utils/response";
import { uploadFile } from "@/lib/storage";
import { env } from "@/config/env";
import { randomUUID } from "crypto";

const router = Router();
router.use(authenticate);
router.use(requireStaff);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// ── helpers ──────────────────────────────────────────────────────

async function getResend() {
  const { Resend } = await import("resend");
  return new Resend(env.RESEND_API_KEY);
}

/** Ensure the requesting staff actually owns this account. */
async function ownedAccount(req: AuthRequest, accountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });
  if (!account) return null;
  if (account.staffMemberId !== req.user!.id) return null;
  return account;
}

// ══════════════════════════════════════════════════════════════════
//  ACCOUNTS
// ══════════════════════════════════════════════════════════════════

// GET /accounts – list my email accounts
router.get("/accounts", async (req: AuthRequest, res) => {
  try {
    const accounts = await prisma.emailAccount.findMany({
      where: { staffMemberId: req.user!.id },
      orderBy: { createdAt: "asc" },
    });
    return ok(res, accounts);
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /accounts – create a new email account (CEO unlimited, others max 1)
const createAccountSchema = z.object({
  address: z.string().email(),
  displayName: z.string().min(1),
  signature: z.string().optional(),
});

router.post(
  "/accounts",
  validate(createAccountSchema),
  async (req: AuthRequest, res) => {
    try {
      const staff = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
        select: { systemRole: true },
      });
      if (!staff) return forbidden(res);

      // Non-CEO can only have 1 email account
      if (staff.systemRole !== "CEO") {
        const count = await prisma.emailAccount.count({
          where: { staffMemberId: req.user!.id },
        });
        if (count >= 1)
          return badRequest(
            res,
            "You can only have one email account. Contact the CEO for additional accounts.",
          );
      }

      // Check if address is already taken
      const existing = await prisma.emailAccount.findUnique({
        where: { address: req.body.address },
      });
      if (existing)
        return badRequest(res, "This email address is already in use");

      const isFirst =
        (await prisma.emailAccount.count({
          where: { staffMemberId: req.user!.id },
        })) === 0;
      const account = await prisma.emailAccount.create({
        data: {
          staffMemberId: req.user!.id,
          address: req.body.address,
          displayName: req.body.displayName,
          signature: req.body.signature,
          isPrimary: isFirst,
        },
      });
      return created(res, account);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// PUT /accounts/:id – update email account
const updateAccountSchema = z.object({
  displayName: z.string().min(1).optional(),
  signature: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

router.put(
  "/accounts/:id",
  validate(updateAccountSchema),
  async (req: AuthRequest, res) => {
    try {
      const account = await ownedAccount(req, req.params.id);
      if (!account) return notFound(res, "Email account");

      // If setting as primary, unset other primaries
      if (req.body.isPrimary) {
        await prisma.emailAccount.updateMany({
          where: { staffMemberId: req.user!.id, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const updated = await prisma.emailAccount.update({
        where: { id: req.params.id },
        data: {
          displayName: req.body.displayName,
          signature: req.body.signature,
          isPrimary: req.body.isPrimary,
        },
      });
      return ok(res, updated);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// DELETE /accounts/:id
router.delete("/accounts/:id", async (req: AuthRequest, res) => {
  try {
    const account = await ownedAccount(req, req.params.id);
    if (!account) return notFound(res, "Email account");

    await prisma.$transaction([
      prisma.emailAttachment.deleteMany({
        where: { message: { accountId: req.params.id } },
      }),
      prisma.emailRecipient.deleteMany({
        where: { message: { accountId: req.params.id } },
      }),
      prisma.emailMessage.deleteMany({ where: { accountId: req.params.id } }),
      prisma.emailAccount.delete({ where: { id: req.params.id } }),
    ]);
    return ok(res, { message: "Email account deleted" });
  } catch (err) {
    return serverError(res, err);
  }
});

// ══════════════════════════════════════════════════════════════════
//  MESSAGES
// ══════════════════════════════════════════════════════════════════

// GET /messages – list messages for a given folder
router.get("/messages", async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const accountId = req.query.accountId as string;
    const folder = (req.query.folder as string) || "inbox";
    const search = (req.query.search as string) || "";

    if (!accountId) return badRequest(res, "accountId is required");

    const account = await ownedAccount(req, accountId);
    if (!account) return notFound(res, "Email account");

    // For "sent" and "drafts" folders → query EmailMessage directly
    if (folder === "sent" || folder === "drafts") {
      const where: any = { accountId, folder };
      if (folder === "drafts") where.isDraft = true;
      if (search) {
        where.OR = [
          { subject: { contains: search } },
          { bodyText: { contains: search } },
        ];
      }

      const [messages, total] = await Promise.all([
        prisma.emailMessage.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            recipients: { select: { address: true, name: true, type: true } },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
              },
            },
          },
        }),
        prisma.emailMessage.count({ where }),
      ]);
      return ok(res, messages, buildMeta(total, page, limit));
    }

    // For "inbox", "trash", "archive", "spam" → query EmailRecipient
    const recipientWhere: any = { accountId, folder };
    if (search) {
      recipientWhere.message = {
        OR: [
          { subject: { contains: search } },
          { bodyText: { contains: search } },
        ],
      };
    }

    const [recipients, total] = await Promise.all([
      prisma.emailRecipient.findMany({
        where: recipientWhere,
        skip,
        take: limit,
        orderBy: { message: { createdAt: "desc" } },
        include: {
          message: {
            include: {
              recipients: { select: { address: true, name: true, type: true } },
              attachments: {
                select: {
                  id: true,
                  fileName: true,
                  fileSize: true,
                  mimeType: true,
                },
              },
              account: { select: { address: true, displayName: true } },
            },
          },
        },
      }),
      prisma.emailRecipient.count({ where: recipientWhere }),
    ]);

    // Map to a unified message shape with recipient-level read/star
    const messages = recipients.map((r) => ({
      ...r.message,
      isRead: r.isRead,
      isStarred: r.isStarred,
      recipientId: r.id,
      folder: r.folder,
    }));

    return ok(res, messages, buildMeta(total, page, limit));
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /messages/:id – single message detail
router.get("/messages/:id", async (req: AuthRequest, res) => {
  try {
    const message = await prisma.emailMessage.findUnique({
      where: { id: req.params.id },
      include: {
        account: {
          select: {
            id: true,
            address: true,
            displayName: true,
            staffMemberId: true,
          },
        },
        recipients: true,
        attachments: true,
      },
    });
    if (!message) return notFound(res, "Message");

    // Verify ownership: either sender or recipient
    const isOwner = message.account.staffMemberId === req.user!.id;
    const isRecipient = await prisma.emailRecipient.findFirst({
      where: {
        messageId: message.id,
        account: { staffMemberId: req.user!.id },
      },
    });
    if (!isOwner && !isRecipient) return forbidden(res);

    // Mark as read for recipient
    if (isRecipient && !isRecipient.isRead) {
      await prisma.emailRecipient.update({
        where: { id: isRecipient.id },
        data: { isRead: true },
      });
    }

    return ok(res, message);
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /messages/:id/thread – get all messages in the same thread
router.get("/messages/:id/thread", async (req: AuthRequest, res) => {
  try {
    const message = await prisma.emailMessage.findUnique({
      where: { id: req.params.id },
      select: {
        threadId: true,
        accountId: true,
        account: { select: { staffMemberId: true } },
      },
    });
    if (!message) return notFound(res, "Message");
    if (message.account.staffMemberId !== req.user!.id) return forbidden(res);

    const threadId = message.threadId || req.params.id;
    const thread = await prisma.emailMessage.findMany({
      where: { OR: [{ threadId }, { id: threadId }] },
      orderBy: { createdAt: "asc" },
      include: {
        account: { select: { address: true, displayName: true } },
        recipients: { select: { address: true, name: true, type: true } },
        attachments: {
          select: { id: true, fileName: true, fileSize: true, mimeType: true },
        },
      },
    });
    return ok(res, thread);
  } catch (err) {
    return serverError(res, err);
  }
});

// ══════════════════════════════════════════════════════════════════
//  COMPOSE / SEND
// ══════════════════════════════════════════════════════════════════

const composeSchema = z.object({
  accountId: z.string().uuid(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1),
  body: z.string().min(1),
  bodyText: z.string().optional(),
  inReplyToId: z.string().uuid().optional(),
  isDraft: z.boolean().optional().default(false),
});

router.post(
  "/messages",
  upload.array("attachments", 10),
  async (req: AuthRequest, res) => {
    try {
      // Parse body (might be multipart)
      const parsed = composeSchema.safeParse(
        typeof req.body.data === "string"
          ? JSON.parse(req.body.data)
          : req.body,
      );
      if (!parsed.success)
        return badRequest(
          res,
          parsed.error.errors[0]?.message || "Invalid data",
        );
      const data = parsed.data;

      const account = await ownedAccount(req, data.accountId);
      if (!account) return notFound(res, "Email account");

      // Determine thread
      let threadId: string | null = null;
      if (data.inReplyToId) {
        const parent = await prisma.emailMessage.findUnique({
          where: { id: data.inReplyToId },
          select: { threadId: true, id: true },
        });
        threadId = parent?.threadId || parent?.id || null;
      }

      const messageId = randomUUID();

      // Upload attachments to R2
      const files = (req.files as Express.Multer.File[]) || [];
      const attachmentData = await Promise.all(
        files.map(async (file) => {
          const result = await uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            {
              folder: "email-attachments",
              maxSizeMb: 25,
            },
          );
          return {
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            storageKey: result.fileName,
            url: result.fileUrl,
          };
        }),
      );

      // Create the message
      const message = await prisma.emailMessage.create({
        data: {
          id: messageId,
          accountId: data.accountId,
          subject: data.subject,
          body: data.body,
          bodyText: data.bodyText || data.body.replace(/<[^>]*>/g, ""),
          threadId,
          inReplyToId: data.inReplyToId,
          isDraft: data.isDraft,
          folder: data.isDraft ? "drafts" : "sent",
          status: data.isDraft ? "draft" : "queued",
          sentAt: data.isDraft ? null : new Date(),
          attachments: { create: attachmentData },
          recipients: {
            create: [
              ...data.to.map((addr) => ({
                address: addr,
                type: "to" as const,
                folder: "inbox",
              })),
              ...data.cc.map((addr) => ({
                address: addr,
                type: "cc" as const,
                folder: "inbox",
              })),
              ...data.bcc.map((addr) => ({
                address: addr,
                type: "bcc" as const,
                folder: "inbox",
              })),
            ],
          },
        },
        include: {
          recipients: true,
          attachments: true,
        },
      });

      // Link internal recipients to their accounts
      const allAddresses = [...data.to, ...data.cc, ...data.bcc];
      const internalAccounts = await prisma.emailAccount.findMany({
        where: { address: { in: allAddresses } },
      });
      if (internalAccounts.length > 0) {
        for (const ia of internalAccounts) {
          await prisma.emailRecipient.updateMany({
            where: { messageId: message.id, address: ia.address },
            data: { accountId: ia.id },
          });
        }
      }

      // Send email via Resend (if not draft)
      if (!data.isDraft && env.RESEND_API_KEY) {
        try {
          const resend = await getResend();
          const fromAddress = `${account.displayName} <${account.address}>`;
          const result = await resend.emails.send({
            from: fromAddress,
            to: data.to,
            cc: data.cc.length > 0 ? data.cc : undefined,
            bcc: data.bcc.length > 0 ? data.bcc : undefined,
            subject: data.subject,
            html: data.body,
            text: data.bodyText,
            reply_to: account.address,
          });

          await prisma.emailMessage.update({
            where: { id: message.id },
            data: {
              resendId: result.data?.id || null,
              status: "sent",
            },
          });
        } catch (sendErr) {
          console.error("[INBOX] Send failed:", sendErr);
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: { status: "failed" },
          });
        }
      }

      return created(res, message);
    } catch (err) {
      return serverError(res, err);
    }
  },
);

// PUT /messages/:id – update draft
router.put("/messages/:id", async (req: AuthRequest, res) => {
  try {
    const message = await prisma.emailMessage.findUnique({
      where: { id: req.params.id },
      include: { account: { select: { staffMemberId: true } } },
    });
    if (!message) return notFound(res, "Message");
    if (message.account.staffMemberId !== req.user!.id) return forbidden(res);
    if (!message.isDraft) return badRequest(res, "Only drafts can be edited");

    const updated = await prisma.emailMessage.update({
      where: { id: req.params.id },
      data: {
        subject: req.body.subject,
        body: req.body.body,
        bodyText: req.body.bodyText,
      },
      include: { recipients: true, attachments: true },
    });
    return ok(res, updated);
  } catch (err) {
    return serverError(res, err);
  }
});

// ══════════════════════════════════════════════════════════════════
//  ACTIONS (read, star, move, delete)
// ══════════════════════════════════════════════════════════════════

// PATCH /messages/:id/read
router.patch("/messages/:id/read", async (req: AuthRequest, res) => {
  try {
    const { isRead } = req.body;
    // Update for recipient
    const recipient = await prisma.emailRecipient.findFirst({
      where: {
        messageId: req.params.id,
        account: { staffMemberId: req.user!.id },
      },
    });
    if (recipient) {
      await prisma.emailRecipient.update({
        where: { id: recipient.id },
        data: { isRead: isRead ?? true },
      });
    } else {
      // It's a sent message — update on the message itself
      const msg = await prisma.emailMessage.findUnique({
        where: { id: req.params.id },
        select: { account: { select: { staffMemberId: true } } },
      });
      if (msg?.account.staffMemberId !== req.user!.id) return forbidden(res);
      await prisma.emailMessage.update({
        where: { id: req.params.id },
        data: { isRead: isRead ?? true },
      });
    }
    return ok(res, { isRead: isRead ?? true });
  } catch (err) {
    return serverError(res, err);
  }
});

// PATCH /messages/:id/star
router.patch("/messages/:id/star", async (req: AuthRequest, res) => {
  try {
    const { isStarred } = req.body;
    const recipient = await prisma.emailRecipient.findFirst({
      where: {
        messageId: req.params.id,
        account: { staffMemberId: req.user!.id },
      },
    });
    if (recipient) {
      await prisma.emailRecipient.update({
        where: { id: recipient.id },
        data: { isStarred: isStarred ?? true },
      });
    } else {
      const msg = await prisma.emailMessage.findUnique({
        where: { id: req.params.id },
        select: { account: { select: { staffMemberId: true } } },
      });
      if (msg?.account.staffMemberId !== req.user!.id) return forbidden(res);
      await prisma.emailMessage.update({
        where: { id: req.params.id },
        data: { isStarred: isStarred ?? true },
      });
    }
    return ok(res, { isStarred: isStarred ?? true });
  } catch (err) {
    return serverError(res, err);
  }
});

// PATCH /messages/:id/move
router.patch("/messages/:id/move", async (req: AuthRequest, res) => {
  try {
    const { folder } = req.body;
    if (!["inbox", "trash", "archive", "spam"].includes(folder)) {
      return badRequest(res, "Invalid folder");
    }

    const recipient = await prisma.emailRecipient.findFirst({
      where: {
        messageId: req.params.id,
        account: { staffMemberId: req.user!.id },
      },
    });
    if (recipient) {
      await prisma.emailRecipient.update({
        where: { id: recipient.id },
        data: { folder },
      });
    } else {
      // Sent message
      const msg = await prisma.emailMessage.findUnique({
        where: { id: req.params.id },
        select: { account: { select: { staffMemberId: true } } },
      });
      if (msg?.account.staffMemberId !== req.user!.id) return forbidden(res);
      await prisma.emailMessage.update({
        where: { id: req.params.id },
        data: { folder },
      });
    }
    return ok(res, { folder });
  } catch (err) {
    return serverError(res, err);
  }
});

// DELETE /messages/:id – permanent delete
router.delete("/messages/:id", async (req: AuthRequest, res) => {
  try {
    const message = await prisma.emailMessage.findUnique({
      where: { id: req.params.id },
      include: { account: { select: { staffMemberId: true } } },
    });
    if (!message) return notFound(res, "Message");
    if (message.account.staffMemberId !== req.user!.id) return forbidden(res);

    await prisma.$transaction([
      prisma.emailAttachment.deleteMany({
        where: { messageId: req.params.id },
      }),
      prisma.emailRecipient.deleteMany({ where: { messageId: req.params.id } }),
      prisma.emailMessage.delete({ where: { id: req.params.id } }),
    ]);
    return ok(res, { message: "Message deleted" });
  } catch (err) {
    return serverError(res, err);
  }
});

// ══════════════════════════════════════════════════════════════════
//  STATS
// ══════════════════════════════════════════════════════════════════

// GET /stats – unread counts per folder
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const accountId = req.query.accountId as string;
    if (!accountId) return badRequest(res, "accountId is required");

    const account = await ownedAccount(req, accountId);
    if (!account) return notFound(res, "Email account");

    const [inbox, sent, drafts, trash, starred] = await Promise.all([
      prisma.emailRecipient.count({
        where: { accountId, folder: "inbox", isRead: false },
      }),
      prisma.emailMessage.count({ where: { accountId, folder: "sent" } }),
      prisma.emailMessage.count({ where: { accountId, isDraft: true } }),
      prisma.emailRecipient.count({ where: { accountId, folder: "trash" } }),
      prisma.emailRecipient.count({ where: { accountId, isStarred: true } }),
    ]);

    return ok(res, {
      unreadInbox: inbox,
      totalSent: sent,
      totalDrafts: drafts,
      totalTrash: trash,
      totalStarred: starred,
    });
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
