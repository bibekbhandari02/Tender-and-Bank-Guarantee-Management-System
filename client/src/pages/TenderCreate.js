import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tenderAPI, uploadAPI } from '../api/tenders';
import TenderForm from '../components/Tender/TenderForm';

const TenderCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async ({ fields, pendingBidNoticeFiles }) => {
    setLoading(true);
    try {
      // 1. Create the tender record
      const res = await tenderAPI.create(fields);
      const newId = res.data.data._id;

      // 2. Upload any pending bid notice files
      if (pendingBidNoticeFiles.length > 0) {
        const formData = new FormData();
        pendingBidNoticeFiles.forEach((f) => formData.append('files', f));
        await uploadAPI.uploadBidNotice(newId, formData);
      }

      toast.success('Tender created successfully');
      navigate(`/tenders/${newId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Tender</h2>
          <p className="text-sm text-gray-500 mt-1">Fill in the details to create a new tender record</p>
        </div>
        <TenderForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default TenderCreate;
