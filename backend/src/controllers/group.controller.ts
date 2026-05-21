import { Response } from 'express';
import { prisma } from '../services/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { simplifyDebts } from '../utils/debtGraph';

// Helper to generate a 6-character random alphanumeric invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createGroup(req: AuthRequest, res: Response) {
  try {
    const { name, description, category } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const inviteCode = generateInviteCode();

    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        category: category || 'GENERAL',
        inviteCode,
        createdById: userId,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        members: {
          create: {
            userId,
            role: 'ADMIN',
            balance: 0.0,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json(group);
  } catch (error: any) {
    console.error('Create group error:', error);
    return res.status(500).json({ error: 'Failed to create group. ' + error.message });
  }
}

export async function getGroups(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find all groups where the user is a member
    const groupMemberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const groups = groupMemberships.map(membership => {
      const g = membership.group;
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        avatar: g.avatar,
        category: g.category,
        inviteCode: g.inviteCode,
        createdById: g.createdById,
        totalExpense: g.totalExpense,
        isArchived: g.isArchived,
        createdAt: g.createdAt,
        userBalance: membership.balance,
        membersCount: g.members.length,
        members: g.members.map(m => ({
          userId: m.userId,
          name: m.user.name,
          avatar: m.user.avatar,
          role: m.role,
        })),
      };
    });

    return res.json(groups);
  } catch (error: any) {
    console.error('Get groups error:', error);
    return res.status(500).json({ error: 'Failed to fetch groups. ' + error.message });
  }
}

export async function getGroupDetails(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
              },
            },
          },
        },
        expenses: {
          orderBy: { date: 'desc' },
          include: {
            paidBy: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            splits: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if requester is a member
    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    // Calculate user's specific owed balance within this group
    const userMembership = group.members.find(m => m.userId === userId);

    return res.json({
      ...group,
      userBalance: userMembership?.balance || 0.0,
    });
  } catch (error: any) {
    console.error('Get group details error:', error);
    return res.status(500).json({ error: 'Failed to fetch group details. ' + error.message });
  }
}

export async function joinGroupByCode(req: AuthRequest, res: Response) {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    const group = await prisma.group.findUnique({
      where: { inviteCode: code.toUpperCase() },
      include: { members: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Invalid invite code. Group not found.' });
    }

    // Check if already a member
    const alreadyMember = group.members.some(m => m.userId === userId);
    if (alreadyMember) {
      return res.status(400).json({ error: 'You are already a member of this group.' });
    }

    // Add user as member
    const newMembership = await prisma.groupMember.create({
      data: {
        userId,
        groupId: group.id,
        role: 'MEMBER',
        balance: 0.0,
      },
      include: {
        group: true,
      },
    });

    return res.status(200).json(newMembership.group);
  } catch (error: any) {
    console.error('Join group error:', error);
    return res.status(500).json({ error: 'Failed to join group. ' + error.message });
  }
}

export async function getGroupBalances(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        expenses: {
          include: {
            splits: true,
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Use transaction-safe cached balances from group members which updates dynamically on expenses and payments
    const netBalances: Record<string, number> = {};
    group.members.forEach(member => {
      netBalances[member.userId] = member.balance;
    });

    // Simplify the debt graph!
    const simplifiedTransactions = simplifyDebts(netBalances);

    // Map member balances with details for rendering
    const memberBalances = group.members.map(member => {
      const balance = +(netBalances[member.userId] || 0.0).toFixed(2);
      return {
        userId: member.userId,
        name: member.user.name,
        avatar: member.user.avatar,
        balance,
      };
    });

    // Clean up transactions with user details (names, avatars)
    const formattedTransactions = simplifiedTransactions.map(tx => {
      const fromUser = group.members.find(m => m.userId === tx.from)?.user;
      const toUser = group.members.find(m => m.userId === tx.to)?.user;
      return {
        from: tx.from,
        fromName: fromUser?.name || 'Unknown',
        fromAvatar: fromUser?.avatar,
        to: tx.to,
        toName: toUser?.name || 'Unknown',
        toAvatar: toUser?.avatar,
        amount: tx.amount,
      };
    });

    return res.json({
      memberBalances,
      settlementPlan: formattedTransactions,
    });
  } catch (error: any) {
    console.error('Get group balances error:', error);
    return res.status(500).json({ error: 'Failed to calculate group balances. ' + error.message });
  }
}

export async function settleAllGroupDebts(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Reset all member balances to 0
    await prisma.groupMember.updateMany({
      where: { groupId: id },
      data: { balance: 0.0 },
    });

    return res.json({ message: 'All balances successfully settled for this group.' });
  } catch (error: any) {
    console.error('Settle group debts error:', error);
    return res.status(500).json({ error: 'Failed to settle balances. ' + error.message });
  }
}
