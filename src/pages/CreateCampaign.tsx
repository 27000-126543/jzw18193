import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAppStore } from '@/store/useAppStore';
import Card from '@/components/ui/Card';
import { ArrowLeft, Save, Calendar, Target, Wallet } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetImpressions: number;
  targetEngagements: number;
  targetClicks: number;
}

export default function CreateCampaign() {
  const navigate = useNavigate();
  const createCampaign = useAppStore((state) => state.createCampaign);
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: {
      budget: 100000,
      targetImpressions: 10000000,
      targetEngagements: 500000,
      targetClicks: 100000,
    },
  });

  const onSubmit = async (data: FormData) => {
    const newCampaign = await createCampaign({
      name: data.name,
      description: data.description,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active',
      kpi: {
        targetImpressions: data.targetImpressions,
        targetEngagements: data.targetEngagements,
        targetClicks: data.targetClicks,
      },
    });
    navigate(`/campaigns/${newCampaign.id}`);
  };

  const steps = [
    { id: 1, title: '基本信息', icon: Calendar },
    { id: 2, title: 'KPI 设置', icon: Target },
    { id: 3, title: '预算配置', icon: Wallet },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/campaigns')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-800">
            创建新活动
          </h1>
          <p className="text-gray-500">填写活动信息，开启KOL合作之旅</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100"
      >
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isCompleted = step > s.id;

          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isCompleted
                      ? 'bg-success-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`font-medium text-sm ${
                    isActive
                      ? 'text-primary-700'
                      : isCompleted
                      ? 'text-success-600'
                      : 'text-gray-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full ${
                    isCompleted ? 'bg-success-500' : 'bg-gray-100'
                  }`}
                />
              )}
            </div>
          );
        })}
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-6">
                活动基本信息
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="input-label">活动名称 *</label>
                  <input
                    type="text"
                    placeholder="例如：2024春季新品上市推广"
                    className="input"
                    {...register('name', { required: '请输入活动名称' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-danger-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="input-label">活动描述 *</label>
                  <textarea
                    rows={4}
                    placeholder="描述活动背景、目标受众、核心信息等"
                    className="input resize-none"
                    {...register('description', {
                      required: '请输入活动描述',
                      minLength: { value: 10, message: '描述至少10个字符' },
                    })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-danger-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">开始日期 *</label>
                    <input
                      type="date"
                      className="input"
                      {...register('startDate', {
                        required: '请选择开始日期',
                      })}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-danger-500">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="input-label">结束日期 *</label>
                    <input
                      type="date"
                      className="input"
                      {...register('endDate', {
                        required: '请选择结束日期',
                      })}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-danger-500">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="btn-primary">
                下一步
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-6">
                设置 KPI 目标
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="input-label">目标曝光量</label>
                  <input
                    type="number"
                    className="input"
                    {...register('targetImpressions', {
                      min: { value: 0, message: '不能为负数' },
                    })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    预计内容总展示次数
                  </p>
                </div>

                <div>
                  <label className="input-label">目标互动量</label>
                  <input
                    type="number"
                    className="input"
                    {...register('targetEngagements', {
                      min: { value: 0, message: '不能为负数' },
                    })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    点赞、评论、转发等互动总数
                  </p>
                </div>

                <div>
                  <label className="input-label">目标转化点击</label>
                  <input
                    type="number"
                    className="input"
                    {...register('targetClicks', {
                      min: { value: 0, message: '不能为负数' },
                    })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    跳转至商品页或落地页的点击量
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                上一步
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary">
                下一步
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="p-6">
              <h2 className="font-display font-semibold text-lg text-gray-800 mb-6">
                预算配置
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="input-label">活动总预算 (元)</label>
                  <input
                    type="number"
                    className="input text-xl font-semibold"
                    {...register('budget', {
                      required: '请输入预算金额',
                      min: { value: 1000, message: '预算至少1000元' },
                    })}
                  />
                  {errors.budget && (
                    <p className="mt-1 text-sm text-danger-500">
                      {errors.budget.message}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-800 mb-4">活动信息汇总</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">活动名称：</span>
                      <span className="font-medium text-gray-800">
                        {watch('name') || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">活动周期：</span>
                      <span className="font-medium text-gray-800">
                        {watch('startDate') || '-'} ~ {watch('endDate') || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">目标曝光：</span>
                      <span className="font-mono font-medium text-gray-800">
                        {watch('targetImpressions')?.toLocaleString() || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">目标互动：</span>
                      <span className="font-mono font-medium text-gray-800">
                        {watch('targetEngagements')?.toLocaleString() || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-secondary"
              >
                上一步
              </button>
              <button type="submit" className="btn-accent">
                <Save className="w-4 h-4" />
                创建活动
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
