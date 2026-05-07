import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { tenderAPI, uploadAPI } from '../api/tenders';
import TenderForm from '../components/Tender/TenderForm';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const TenderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    tenderAPI
      .getById(id)
      .then((res) => setTender(res.data.data))
      .catch((err) => {
        toast.error(err.message);
        navigate('/tenders');
      })
      .finally(() => setFetching(false));
  }, [id, navigate]);

  const handleSubmit = async ({ fields, pendingBidNoticeFiles }) => {
    setLoading(true);
    try {
      // Strip file arrays — managed separately via upload endpoints
      const { bidNoticeFiles, contractFiles, ...safeFields } = fields;

      // 1. Update tender fields only
      await tenderAPI.update(id, safeFields);

      // 2. Upload any newly added bid notice files
      if (pendingBidNoticeFiles.length > 0) {
        const formData = new FormData();
        pendingBidNoticeFiles.forEach((f) => formData.append('files', f));
        await uploadAPI.uploadBidNotice(id, formData);
      }

      toast.success('Tender updated successfully');
      navigate(`/tenders/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBidNoticeFile = async (fileId) => {
    try {
      await uploadAPI.deleteBidNoticeFile(id, fileId);
      // Refresh tender so the removed file disappears from the form
      const res = await tenderAPI.getById(id);
      setTender(res.data.data);
      toast.success('File removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  if (fetching) return <LoadingSpinner text="Loading tender..." />;
  if (!tender) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Tender</h2>
          <p className="text-sm text-gray-500 mt-1">
            Contract: <span className="font-mono font-semibold text-primary-600">{tender.contractNumber}</span>
          </p>
        </div>
        <TenderForm
          initialData={tender}
          onSubmit={handleSubmit}
          onDeleteBidNoticeFile={handleDeleteBidNoticeFile}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default TenderEdit;
