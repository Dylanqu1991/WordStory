import React, { useState } from 'react';
import type { User, ActivationCode } from '../types';
import { CloseIcon, TrashIcon, DownloadIcon, EditIcon, RefreshIcon } from './Icons';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  codes: ActivationCode[];
  onAddUser: (user: Omit<User, 'role' | 'activationCodeUsed' | 'email'> & { email?: string }) => Promise<void>;
  onDeleteUser: (phone: string) => Promise<void>;
  onGenerateCodes: (count: number) => Promise<void>;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  codes,
  onAddUser,
  onDeleteUser,
  onGenerateCodes,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'codes'>('users');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-slate-50 rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-700">管理用户和激活码</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800" aria-label="Close"><CloseIcon /></button>
        </div>

        <div className="p-6 flex-grow flex flex-col overflow-hidden">
            <div className="flex border-b mb-4">
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-semibold ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>用户管理</button>
                <button onClick={() => setActiveTab('codes')} className={`px-4 py-2 font-semibold ${activeTab === 'codes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>激活码管理</button>
            </div>
            {activeTab === 'users' && <UserManagementTab users={users} onAddUser={onAddUser} onDeleteUser={onDeleteUser} />}
            {activeTab === 'codes' && <CodeManagementTab codes={codes} onGenerateCodes={onGenerateCodes} />}
        </div>
      </div>
    </div>
  );
};

// --- User Management Tab ---
const UserManagementTab:React.FC<{users: User[], onAddUser: (user: any) => Promise<void>, onDeleteUser: Function}> = ({ users, onAddUser, onDeleteUser }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onAddUser({ phone, password, email });
            setPhone('');
            setPassword('');
            setEmail('');
        } catch(error) {
            // Error notification is handled in App.tsx
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4 p-4 border rounded-lg bg-white">
                <h3 className="font-semibold text-slate-700 mb-3">添加新用户</h3>
                <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="手机号 (必填)" required className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"/>
                    <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码 (必填)" required className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"/>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱 (选填)" className="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"/>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                         {isLoading ? <RefreshIcon className="w-5 h-5 mx-auto" spinning /> : '添加用户'}
                    </button>
                </form>
            </div>
            <div className="flex-grow overflow-y-auto border rounded-lg bg-white">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">手机号</th>
                            <th scope="col" className="px-6 py-3">密码 (操作)</th>
                            <th scope="col" className="px-6 py-3">使用激活码</th>
                            <th scope="col" className="px-6 py-3">删除</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user.phone} className={`border-b hover:bg-sky-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                <td className="px-6 py-4 font-medium text-slate-900">{user.phone}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span>{user.password}</span>
                                        <button 
                                            onClick={() => alert("出于安全考虑，请在 LeanCloud 控制台中手动重置用户密码。")}
                                            className="text-slate-400 hover:text-blue-600"
                                            title="重置密码"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{user.activationCodeUsed}</td>
                                <td className="px-6 py-4">
                                    {user.role !== 'admin' && (
                                        <button onClick={() => onDeleteUser(user.phone)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Activation Code Management Tab ---
const CodeManagementTab: React.FC<{codes: ActivationCode[], onGenerateCodes: (count: number) => Promise<void>}> = ({ codes, onGenerateCodes }) => {
    const [generateCount, setGenerateCount] = useState(10);
    const [isLoading, setIsLoading] = useState(false);

    // --- Stats Calculation ---
    const totalCodes = codes.length;
    const usedCodesCount = codes.filter(c => c.isUsed).length;
    const usageRate = totalCodes > 0 ? ((usedCodesCount / totalCodes) * 100).toFixed(1) : '0.0';

    const handleGenerate = async () => {
        if (generateCount > 0) {
            setIsLoading(true);
            try {
                await onGenerateCodes(generateCount);
            } catch(error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleExportTodaysCodes = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysUnusedCodes = codes
            .filter(c => !c.isUsed && new Date(c.createdAt) >= today)
            .map(c => c.code)
            .join('\n');

        if (todaysUnusedCodes.length === 0) {
            alert("今天没有新创建的未使用激活码可以导出。");
            return;
        }

        const blob = new Blob([todaysUnusedCodes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const dateString = new Date().toISOString().split('T')[0];
        a.download = `unused_codes_${dateString}.txt`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-white rounded-lg border text-center">
                    <h4 className="text-sm font-medium text-slate-500">总数量</h4>
                    <p className="text-3xl font-bold text-slate-800">{totalCodes}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border text-center">
                    <h4 className="text-sm font-medium text-slate-500">已使用</h4>
                    <p className="text-3xl font-bold text-slate-800">{usedCodesCount}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border text-center">
                    <h4 className="text-sm font-medium text-slate-500">使用率</h4>
                    <p className="text-3xl font-bold text-slate-800">{usageRate}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 border rounded-lg bg-white">
                    <h3 className="font-semibold text-slate-700 mb-2">生成新激活码</h3>
                    <div className="flex items-center gap-3">
                        <input 
                            type="number" 
                            value={generateCount} 
                            onChange={e => setGenerateCount(parseInt(e.target.value, 10))} 
                            min="1" 
                            max="100" 
                            className="p-2 border rounded-md w-24 focus:ring-blue-500 focus:border-blue-500"
                            aria-label="Number of codes to generate"
                        />
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                        >
                            {isLoading ? <RefreshIcon className="w-5 h-5 mx-auto" spinning /> : '生成'}
                        </button>
                    </div>
                </div>

                <div className="p-4 border rounded-lg bg-white">
                     <h3 className="font-semibold text-slate-700 mb-2">导出今日激活码</h3>
                     <button 
                        onClick={handleExportTodaysCodes} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
                    >
                        <DownloadIcon className="w-5 h-5"/> 
                        导出今天创建的未使用激活码 (.txt)
                    </button>
                </div>
            </div>
             <div className="flex-grow overflow-y-auto border rounded-lg bg-white">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">激活码</th>
                            <th scope="col" className="px-6 py-3">状态</th>
                            <th scope="col" className="px-6 py-3">使用者</th>
                            <th scope="col" className="px-6 py-3">使用时间</th>
                            <th scope="col" className="px-6 py-3">创建时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {codes.map((code, index) => (
                            <tr key={code.code} className={`border-b hover:bg-sky-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                <td className="px-6 py-4 font-mono text-slate-900">{code.code}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${code.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {code.isUsed ? '已使用' : '未使用'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{code.usedBy || 'N/A'}</td>
                                <td className="px-6 py-4">{code.usedAt ? new Date(code.usedAt).toLocaleString() : 'N/A'}</td>
                                <td className="px-6 py-4">{code.createdAt ? new Date(code.createdAt).toLocaleString() : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagementModal;