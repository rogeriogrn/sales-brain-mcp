import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../repositories/postgres/client.js';
import { AuditRepository } from '../../repositories/postgres/audit.js';

export const AdminController = {
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Total Leads
      const totalLeads = await prisma.lead.count();

      // 2. Turns today (since 00:00:00 local time)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const turnsToday = await prisma.turn.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      });

      // 3. Signals grouped by signalType
      const signalCounts = await prisma.signal.groupBy({
        by: ['signalType'],
        _count: {
          id: true,
        },
      });

      const signalsByType = signalCounts.reduce((acc, curr) => {
        acc[curr.signalType] = curr._count.id;
        return acc;
      }, {} as Record<string, number>);

      // 4. Funnel stage distribution based on latest StrategySnapshot per lead
      const allSnapshots = await prisma.strategySnapshot.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      const leadLatestStage = new Map<string, string>();
      for (const snap of allSnapshots) {
        if (!leadLatestStage.has(snap.leadId)) {
          leadLatestStage.set(snap.leadId, snap.stage);
        }
      }

      const funnelDistribution: Record<string, number> = {};
      for (const stage of leadLatestStage.values()) {
        funnelDistribution[stage] = (funnelDistribution[stage] || 0) + 1;
      }

      return reply.status(200).send({
        totalLeads,
        turnsToday,
        signalsByType,
        funnelDistribution,
      });
    } catch (err: any) {
      request.log.error(err, 'Erro ao recuperar estatísticas administrativas');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao recuperar as estatísticas do painel',
      });
    }
  },

  async getAuditByLead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { leadId } = request.params as { leadId: string };
      const { limit } = request.query as { limit?: string };

      if (!leadId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'O parâmetro leadId é obrigatório',
        });
      }

      const parsedLimit = limit ? parseInt(limit, 10) : 20;
      const logs = await AuditRepository.findByLeadId(leadId, parsedLimit);

      // Parse payloadJson string to native object for easier consumption
      const parsedLogs = logs.map(log => ({
        ...log,
        payloadJson: log.payloadJson ? JSON.parse(log.payloadJson) : null,
      }));

      return reply.status(200).send(parsedLogs);
    } catch (err: any) {
      request.log.error(err, `Erro ao buscar logs de auditoria do lead ${request.params}`);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao buscar os logs de auditoria do lead',
      });
    }
  },
};
