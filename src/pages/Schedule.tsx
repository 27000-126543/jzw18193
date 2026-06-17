import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '@/store/useAppStore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Send,
  Eye,
  ChevronRight,
} from 'lucide-react';
import type { TimelineNode } from '@/types';

export default function Schedule() {
  const invitations = useAppStore(useShallow((state) => state.invitations));
  const reviews = useAppStore(useShallow((state) => state.reviews));

  const acceptedInvitations = useMemo(() => {
    return invitations.filter((i) => i.status === 'accepted');
  }, [invitations]);

  const timeline: TimelineNode[] = useMemo(() => {
    return acceptedInvitations
      .slice(0, 10)
      .map((inv, index) => {
        const review = reviews.find((r) => r.invitationId === inv.id);
        const now = new Date();
        const publishDate = inv.publishDate
          ? new Date(inv.publishDate)
          : new Date(now.getTime() + Math.random() * 30 * 86400000);
        const diffDays = Math.ceil(
          (publishDate.getTime() - now.getTime()) / 86400000
        );

        let status: TimelineNode['status'] = 'upcoming';
        if (review?.status === 'approved') {
          status = 'completed';
        } else if (review?.status === 'pending') {
          status = 'current';
        } else if (diffDays < 0) {
          status = 'delayed';
        } else if (diffDays <= 7) {
          status = 'current';
        }

        return {
          id: inv.id,
          title: `${inv.kolName} - 内容发布`,
          date: publishDate.toISOString().split('T')[0],
          status,
          description: inv.campaignName,
          kolName: inv.kolName,
          campaignName: inv.campaignName,
        };
      });
  }, [acceptedInvitations, reviews]);

  const counts = useMemo(() => ({
    upcoming: timeline.filter((t) => t.status === 'upcoming').length,
    current: timeline.filter((t) => t.status === 'current').length,
    completed: timeline.filter((t) => t.status === 'completed').length,
    delayed: timeline.filter((t) => t.status === 'delayed').length,
  }), [timeline]);

  const upcomingCount = counts.upcoming;
  const currentCount = counts.current;
  const completedCount = counts.completed;
  const delayedCount = counts.delayed;

  const getStatusStyle = (status: TimelineNode['status']) => {
    switch (status) {
      case 'completed':
        return {
          dot: 'bg-success-500',
          line: 'bg-success-500',
          text: 'text-success-600',
        };
      case 'current':
        return {
          dot: 'bg-primary-500 animate-pulse-slow',
          line: 'bg-gray-200',
          text: 'text-primary-600',
        };
      case 'delayed':
        return {
          dot: 'bg-danger-500',
          line: 'bg-danger-200',
          text: 'text-danger-600',
        };
      default:
        return {
          dot: 'bg-gray-300',
          line: 'bg-gray-200',
          text: 'text-gray-500',
        };
    }
  };

  const getStatusIcon = (status: TimelineNode['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'current':
        return <Clock className="w-5 h-5 text-white" />;
      case 'delayed':
        return <AlertCircle className="w-5 h-5 text-white" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">即将开始</p>
              <p className="font-display font-bold text-xl text-gray-800">
                {upcomingCount}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">进行中</p>
              <p className="font-display font-bold text-xl text-primary-600">
                {currentCount}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">已完成</p>
              <p className="font-display font-bold text-xl text-success-600">
                {completedCount}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">已延期</p>
              <p className="font-display font-bold text-xl text-danger-600">
                {delayedCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg text-gray-800">
                排期时间线
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-700 text-white">
                  全部
                </button>
                <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">
                  本周
                </button>
                <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">
                  本月
                </button>
              </div>
            </div>

            <div className="relative">
              {timeline.map((node, index) => {
                const style = getStatusStyle(node.status);
                const isLast = index === timeline.length - 1;

                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex gap-6 pb-8 last:pb-0"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`timeline-dot ${style.dot} flex items-center justify-center z-10`}
                      >
                        {getStatusIcon(node.status)}
                      </div>
                      {!isLast && (
                        <div
                          className={`absolute top-4 w-0.5 h-full ${style.line}`}
                        />
                      )}
                    </div>

                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3
                              className={`font-medium ${
                                node.status === 'completed'
                                  ? 'text-gray-400'
                                  : 'text-gray-800'
                              }`}
                            >
                              {node.title}
                            </h3>
                            {node.status === 'delayed' && (
                              <Badge status="rejected">已延期</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            {node.description}
                          </p>
                          <div className="flex items-center gap-4">
                            <span
                              className={`text-sm font-medium ${style.text}`}
                            >
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {node.date}
                            </span>
                            {node.status === 'current' && (
                              <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                查看内容
                              </button>
                            )}
                            {node.status === 'completed' && (
                              <button className="text-sm text-success-600 hover:text-success-700 flex items-center gap-1">
                                查看报告
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 bg-gradient-to-br from-primary-50 to-accent-50">
            <h3 className="font-semibold text-primary-800 mb-4">
              近期关键节点
            </h3>
            <div className="space-y-3">
              {timeline
                .filter((t) => t.status === 'current' || t.status === 'delayed')
                .slice(0, 5)
                .map((node) => {
                  const style = getStatusStyle(node.status);
                  return (
                    <div
                      key={node.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${style.dot}`}
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            {node.kolName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {node.campaignName}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${style.text}`}>
                        {node.date}
                      </span>
                    </div>
                  );
                })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              交付里程碑模板
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Send className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">发送邀约</p>
                  <p className="text-xs text-gray-500">合作意向确认</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FileText className="w-5 h-5 text-accent-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">内容提交</p>
                  <p className="text-xs text-gray-500">初稿审核</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Eye className="w-5 h-5 text-success-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">正式发布</p>
                  <p className="text-xs text-gray-500">全平台推送</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
