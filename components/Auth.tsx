import React, { useState } from 'react';
import type { User } from '../types';
import type { LeanCloudService } from '../services/leanCloudService';
import { BookOpenIcon } from './Icons';

interface AuthProps {
  onLoginSuccess: (user: User) => Promise<void>;
  leanCloudService: LeanCloudService;
}

type AuthView = 'login' | 'register' | 'reset';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, leanCloudService }) => {
  const [view, setView] = useState<AuthView>('login');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleSwitchView = (newView: AuthView) => {
    setView(newView);
    setError(null);
    setResetSuccessMessage(null);
    // Reset fields for cleaner transition
    setPhone('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setActivationCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccessMessage(null);
    setIsLoading(true);

    try {
      if (view === 'login') {
        const user = await leanCloudService.login(phone, password);
        await onLoginSuccess(user);
      } else if (view === 'register') {
        if (password !== confirmPassword) {
          throw new Error('两次输入的密码不一致。');
        }
        const user = await leanCloudService.register(phone, password, email, activationCode);
        await onLoginSuccess(user);
      } else if (view === 'reset') {
        await leanCloudService.requestPasswordReset(email);
        setResetSuccessMessage('密码重置邮件已发送，请检查您的收件箱。');
        setView('login'); // Switch back to login view after success
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderFormContent = () => {
    if (view === 'reset') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-center text-slate-500 pb-2">请输入您的注册邮箱，我们将向您发送密码重置链接。</p>
          <div>
            <input
              id="email"
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div> : '发送重置链接'}
          </button>
        </form>
      );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="phone"
                type="tel"
                placeholder="手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {view === 'register' && (
                <div>
                <input
                    id="email"
                    type="email"
                    placeholder="邮箱 (用于找回密码)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
            )}

            <div>
              <input
                id="password"
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {view === 'register' && (
              <>
                <div>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    id="activationCode"
                    type="text"
                    placeholder="激活码"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1 pl-1">激活码请联系商家获取。</p>
                </div>
              </>
            )}
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {resetSuccessMessage && <p className="text-green-600 text-sm text-center">{resetSuccessMessage}</p>}


            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
              ) : (
                view === 'login' ? '登录' : '注册'
              )}
            </button>
          </form>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-slate-50 p-4 pt-16 sm:pt-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <BookOpenIcon className="mx-auto h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">看故事背单词</h1>
            <p className="text-slate-500 mt-2">
                {view === 'login' && '欢迎回来！'}
                {view === 'register' && '创建您的新账户'}
                {view === 'reset' && '重置您的密码'}
            </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200">
          {view !== 'reset' && (
            <div className="flex border-b mb-6">
                <button
                onClick={() => handleSwitchView('login')}
                className={`flex-1 py-3 font-semibold text-center transition-colors ${view === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                >
                登录
                </button>
                <button
                onClick={() => handleSwitchView('register')}
                className={`flex-1 py-3 font-semibold text-center transition-colors ${view === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                >
                注册
                </button>
            </div>
          )}

          {renderFormContent()}

           <div className="text-center text-sm text-slate-500 mt-6">
            {view === 'login' && (
              <div className="flex justify-between items-center">
                 <button onClick={() => handleSwitchView('reset')} className="hover:underline text-blue-600">忘记密码？</button>
                 <span>没有账号？ <button onClick={() => handleSwitchView('register')} className="font-semibold hover:underline text-blue-600">立即注册</button></span>
              </div>
            )}
            {view === 'register' && (
              <p>
                已有账号？ <button onClick={() => handleSwitchView('login')} className="font-semibold hover:underline text-blue-600">返回登录</button>
              </p>
            )}
            {view === 'reset' && (
              <p>
                记起密码了？ <button onClick={() => handleSwitchView('login')} className="font-semibold hover:underline text-blue-600">返回登录</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;