import { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAppStore } from '@/store/useAppStore';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { formatNumber, formatMoney, cn } from '@/utils';
import { X, Send, Loader2, Users } from 'lucide-react';
import type { KOL } from '@/types';

interface SendInvitationModalProps {
  open: boolean;
  kol: KOL | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  campaignId: string;
  fee: number;
  contentRequirements: string;
  timeline: string;
  publishDate?: string;
}

export default function SendInvitationModal({
  open,
  kol,
  onClose,
  onSuccess,
}: SendInvitationModalProps) {
  const campaigns = useAppStore((state) => state.campaigns);
  const sendInvitation = useAppStore((state) => state.sendInvitation);

  const availableCampaigns = useMemo(
    () =>
      campaigns.filter(
        (c) => c.status === 'active' || c.status === 'draft'
      ),
    [campaigns]
  );

  const defaultCampaignId = availableCampaigns[0]?.id || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      campaignId: defaultCampaignId,
      fee: kol?.price || 0,
      contentRequirements: '',
      timeline: '内容草稿3日内提交，确认后7日内发布',
      publishDate: '',
    },
  });

  useEffect(() => {
    if (open && kol) {
      reset({
        campaignId: defaultCampaignId,
        fee: kol.price,
        contentRequirements: '',
        timeline: '内容草稿3日内提交，确认后7日内发布',
        publishDate: '',
      });
    }
  }, [open, kol, defaultCampaignId, reset]);

  const selectedCampaignId = watch('campaignId');
  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId),
    [campaigns, selectedCampaignId]
  );

  const onSubmit = async (data: FormData) => {
    if (!kol || !selectedCampaign) return;

    try {
      await sendInvitation({
        campaignId: data.campaignId,
        kolId: kol.id,
        kolName: kol.name,
        campaignName: selectedCampaign.name,
        fee: data.fee,
        contentRequirements: data.contentRequirements,
        timeline: data.timeline,
        publishDate: data.publishDate || undefined,
      });
      alert('邀约发送成功！');
      onClose();
      onSuccess?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : '发送失败，请稍后重试');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!open || !kol) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
            'sm:flex sm:items-center sm:justify-center sm:p-4',
            'flex flex-col'
          )}
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={cn(
              'bg-white shadow-2xl overflow-hidden flex flex-col',
              'sm:rounded-2xl sm:max-w-[640px] sm:w-full sm:max-h-[90vh]',
              'w-full h-full rounded-none'
            )}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-display font-bold text-xl text-gray-800">
                发送邀约
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isSubmitting
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 sm:px-6 py-5 space-y-5">
              <div className="card p-4 bg-gradient-to-br from-primary-50/50 to-accent-50/50">
                <div className="flex items-start gap-4">
                  <img
                    src={kol.avatar}
                    alt={kol.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-gray-800 text-lg truncate">
                        {kol.name}
                      </h3>
                      <PlatformBadge platform={kol.platform} />
                    </div>
                    <div className="flex items-center gap-5 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="w-4 h-4" />
                        <span className="font-mono font-medium text-gray-700">
                          {formatNumber(kol.followers)}
                        </span>
                        <span>粉丝</span>
                      </div>
                      <div className="text-gray-500">
                        报价：
                        <span className="font-mono font-semibold text-accent-600 text-base">
                          {formatMoney(kol.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form
                id="invitation-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div>
                  <label className="input-label">
                    选择活动 <span className="text-danger-500">*</span>
                  </label>
                  <select
                    className="input"
                    {...register('campaignId', {
                      required: '请选择活动',
                    })}
                  >
                    {availableCampaigns.length === 0 ? (
                      <option value="" disabled>
                        暂无可用活动，请先创建活动
                      </option>
                    ) : (
                      availableCampaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.campaignId && (
                    <p className="mt-1 text-sm text-danger-500">
                      {errors.campaignId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="input-label">
                    报价 (元) <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    className="input"
                    {...register('fee', {
                      required: '请输入报价',
                      min: { value: 0, message: '报价不能为负数' },
                    })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    KOL 参考报价：{formatMoney(kol.price)}，可根据实际情况调整
                  </p>
                  {errors.fee && (
                    <p className="mt-1 text-sm text-danger-500">
                      {errors.fee.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="input-label">内容要求</label>
                  <textarea
                    rows={5}
                    placeholder="请填写内容方向、产品卖点、品牌调性要求、禁止内容等..."
                    className="input resize-none"
                    {...register('contentRequirements')}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    例如：突出产品核心卖点，品牌风格年轻活力，禁止贬低竞品等
                  </p>
                </div>

                <div>
                  <label className="input-label">
                    时间要求 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    {...register('timeline', {
                      required: '请填写时间要求',
                    })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    说明内容提交、审核、发布等各阶段的时间节点
                  </p>
                  {errors.timeline && (
                    <p className="mt-1 text-sm text-danger-500">
                      {errors.timeline.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="input-label">预期发布日期</label>
                  <input
                    type="date"
                    className="input"
                    {...register('publishDate')}
                  />
                  <p className="mt-1 text-xs text-gray-500">可选，预估的内容发布时间</p>
                </div>
              </form>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={cn(
                    'btn-secondary',
                    isSubmitting && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  取消
                </button>
                <button
                  type="submit"
                  form="invitation-form"
                  disabled={isSubmitting || availableCampaigns.length === 0}
                  className={cn(
                    'btn-primary min-w-[120px]',
                    (isSubmitting || availableCampaigns.length === 0) &&
                      'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      发送邀约
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
