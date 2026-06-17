import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  FileCheck,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  X,
  Image,
  Paperclip,
} from 'lucide-react';
import type { ReviewStatus } from '@/types';

const statusFilters: { value: ReviewStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
];

export default function ContentReview() {
  const reviews = useAppStore(useShallow((state) => state.reviews));
  const approveReview = useAppStore((state) => state.approveReview);
  const rejectReview = useAppStore((state) => state.rejectReview);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      return statusFilter === 'all' || r.status === statusFilter;
    });
  }, [reviews, statusFilter]);

  const pendingCount = useMemo(() => {
    return reviews.filter((r) => r.status === 'pending').length;
  }, [reviews]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    statusFilters.forEach((filter) => {
      if (filter.value !== 'all') {
        counts[filter.value] = reviews.filter((r) => r.status === filter.value).length;
      }
    });
    return counts;
  }, [reviews]);

  const handleApprove = async (id: string) => {
    await approveReview(id, feedback);
    setSelectedReview(null);
    setFeedback('');
  };

  const handleReject = async (id: string) => {
    if (!feedback.trim()) {
      alert('请填写修改意见');
      return;
    }
    await rejectReview(id, feedback);
    setSelectedReview(null);
    setFeedback('');
  };

  const selectedReviewData = useMemo(() => {
    return reviews.find((r) => r.id === selectedReview);
  }, [reviews, selectedReview]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-800">
            内容审核
          </h1>
          <p className="text-gray-500 mt-1">
            审核KOL提交的内容草稿，确保符合品牌要求
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-accent-50 rounded-full">
            <Clock className="w-4 h-4 text-accent-600" />
            <span className="text-sm font-medium text-accent-700">
              {pendingCount} 条内容待审核
            </span>
          </div>
        )}
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
            {filter.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-80">
                ({statusCounts[filter.value]})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-5 cursor-pointer transition-all ${
                  selectedReview === review.id
                    ? 'ring-2 ring-primary-500 border-primary-200'
                    : ''
                }`}
                onClick={() => setSelectedReview(review.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">
                        {review.kolName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {review.kolName}
                      </h3>
                      <p className="text-sm text-gray-500">{review.campaignName}</p>
                    </div>
                  </div>
                  <Badge status={review.status} />
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {review.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-4 h-4" />
                      v{review.version}
                    </span>
                    <span>
                      提交于{' '}
                      {new Date(review.submittedAt).toLocaleDateString('zh-CN')}
                    </span>
                    {review.attachments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        {review.attachments.length} 张附图
                      </span>
                    )}
                  </div>
                  {review.status === 'pending' && (
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      审核
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedReviewData ? (
            <motion.div
              key={selectedReviewData.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Card className="p-6 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-lg text-gray-800">
                    审核详情
                  </h3>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <img
                    src={`https://i.pravatar.cc/100?u=${selectedReviewData.kolName}`}
                    alt={selectedReviewData.kolName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedReviewData.kolName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedReviewData.campaignName}
                    </p>
                  </div>
                  <Badge
                    status={selectedReviewData.status}
                    className="ml-auto"
                  />
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-2">内容正文</h4>
                  <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-700">
                    {selectedReviewData.content}
                  </div>
                </div>

                {selectedReviewData.attachments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">附件图片</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedReviewData.attachments.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`附件 ${i + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedReviewData.feedback && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-2">历史反馈</h4>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-800">
                        {selectedReviewData.feedback}
                      </p>
                    </div>
                  </div>
                )}

                {selectedReviewData.status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <label className="input-label">审核意见</label>
                      <textarea
                        rows={3}
                        placeholder="请输入修改意见（驳回时必填）"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="input resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReject(selectedReviewData.id)}
                        className="flex-1 btn-danger"
                      >
                        <XCircle className="w-4 h-4" />
                        驳回修改
                      </button>
                      <button
                        onClick={() => handleApprove(selectedReviewData.id)}
                        className="flex-1 btn-primary"
                      >
                        <CheckCircle className="w-4 h-4" />
                        通过审核
                      </button>
                    </div>
                  </div>
                )}

                {selectedReviewData.status !== 'pending' && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      该内容已于{' '}
                      {selectedReviewData.reviewedAt &&
                        new Date(
                          selectedReviewData.reviewedAt
                        ).toLocaleDateString('zh-CN')}{' '}
                      完成审核
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center"
            >
              <Card className="p-12 text-center w-full">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">选择左侧内容进行查看或审核</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
