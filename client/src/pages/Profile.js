import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/tenders';
import toast from 'react-hot-toast';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', companyName: user?.companyName || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Required';
    if (!pwForm.newPassword) errs.newPassword = 'Required';
    else if (pwForm.newPassword.length < 6) errs.newPassword = 'Min. 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and security settings</p>
      </div>

      {/* Profile Info */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <UserCircleIcon className="w-5 h-5 text-primary-600" />
          Profile Information
        </h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="form-label">Full Name</label>
            <input type="text" value={profileForm.name}
              onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
              className="form-input" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={user?.email} disabled className="form-input bg-gray-50 text-gray-400 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="form-label">Company Name</label>
            <input type="text" value={profileForm.companyName}
              onChange={(e) => setProfileForm((p) => ({ ...p, companyName: e.target.value }))}
              placeholder="Your company name"
              className="form-input" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <KeyIcon className="w-5 h-5 text-primary-600" />
          Change Password
        </h3>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className="form-label">Current Password</label>
            <input type="password" value={pwForm.currentPassword}
              onChange={(e) => { setPwForm((p) => ({ ...p, currentPassword: e.target.value })); setPwErrors((p) => ({ ...p, currentPassword: '' })); }}
              className={`form-input ${pwErrors.currentPassword ? 'border-red-400' : ''}`} />
            {pwErrors.currentPassword && <p className="form-error">{pwErrors.currentPassword}</p>}
          </div>
          <div>
            <label className="form-label">New Password</label>
            <input type="password" value={pwForm.newPassword}
              onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwErrors((p) => ({ ...p, newPassword: '' })); }}
              placeholder="Min. 6 characters"
              className={`form-input ${pwErrors.newPassword ? 'border-red-400' : ''}`} />
            {pwErrors.newPassword && <p className="form-error">{pwErrors.newPassword}</p>}
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword}
              onChange={(e) => { setPwForm((p) => ({ ...p, confirmPassword: e.target.value })); setPwErrors((p) => ({ ...p, confirmPassword: '' })); }}
              className={`form-input ${pwErrors.confirmPassword ? 'border-red-400' : ''}`} />
            {pwErrors.confirmPassword && <p className="form-error">{pwErrors.confirmPassword}</p>}
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
