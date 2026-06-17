import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, formatNumber } from '@/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import {
  Search,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  DollarSign,
} from 'lucide-react';
import type { InvitationStatus } from '@/types';

const statusFilters: { value: InvitationStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待确认' },
  { value: 'negotiating', label: '协商中' },
  { value: 'accepted', label: '已接受' },
  { value: 'rejected', label: '已拒绝' },
];

export default function Invitations() {
  const invitations = useAppStore(useShallow((state) => state.invitations));
  const updateInvitationStatus = useAppStore((state) => state.updateInvitationStatus);
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        inv.kolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.campaignName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [invitations, statusFilter, searchQuery]);

  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-danger-500" />;
      case 'negotiating':
        return <MessageCircle className="w-4 h-4 text-accent-500" />;
    }
  };

  const handleAccept = async (id: string) => {
    await updateInvitationStatus(id, 'accepted');
  };

  const handleReject = async (id: string) => {
    await updateInvitationStatus(id, 'rejected');
  };

  const stats = useMemo(() => ({
    total: invitations.length,
    pending: invitations.filter((i) => i.status === 'pending').length,
    accepted: invitations.filter((i) => i.status === 'accepted').length,
    rejected: invitations.filter((i) => i.status === 'rejected').length,
  }), [invitations]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">总邀约数</p>
              <p className="font-display font-bold text-xl text-gray-800">
                {stats.total}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">待确认</p>
              <p className="font-display font-bold text-xl text-amber-600">
                {stats.pending}
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
              <p className="text-xs text-gray-500">已接受</p>
              <p className="font-display font-bold text-xl text-success-600">
                {stats.accepted}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">已拒绝</p>
              <p className="font-display font-bold text-xl text-danger-600">
                {stats.rejected}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索KOL或活动名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.value
                  ? 'bg-primary-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredInvitations.map((invitation, index) => (
          <motion.div
            key={invitation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-semibold">
                      {invitation.kolName?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-800">
                        {invitation.kolName}
                      </h3>
                      <Badge status={invitation.status} />
                    </div>
                    <p className="text-sm text-gray-500 mb-2 truncate">
                      {invitation.campaignName}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatMoney(invitation.fee)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          发布日期: {invitation.publishDate || '待确认'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          创建于{' '}
                          {new Date(invitation.createdAt).toLocaleDateString(
                            'zh-CN'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:ml-4">
                  {invitation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAccept(invitation.id)}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        <XCircle className="w-4 h-4" />
                        拒绝
                      </button>
                      <button
                        onClick={() => handleAccept(invitation.id)}
                        className="btn-primary text-sm py-2 px-3"
                      >
                        <CheckCircle className="w-4 h-4" />
                        确认合作
                      </button>
                    </>
                  )}
                  {invitation.status === 'negotiating' && (
                    <button className="btn-accent text-sm py-2 px-3">
                      <MessageCircle className="w-4 h-4" />
                      继续沟通
                    </button>
                  )}
                  {invitation.status === 'accepted' && (
                    <button className="btn-secondary text-sm py-2 px-3">
                      查看详情
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredInvitations.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">暂无匹配的邀约记录</p>
        </div>
      )}
    </div>
  );
}
