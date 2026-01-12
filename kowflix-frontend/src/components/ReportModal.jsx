
import React, { useState } from 'react';
import { reportAPI } from '../services/api';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import './ReportModal.css';

const ReportModal = ({ movieId, isOpen, onClose }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const reasons = [
        "Video không chạy",
        "Sai nội dung/tên phim",
        "Phụ đề lỗi/không khớp",
        "Âm thanh lỗi",
        "Khác"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason) {
            setError('Vui lòng chọn lý do báo cáo');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await reportAPI.create({
                movieId,
                reason,
                description
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setReason('');
                setDescription('');
            }, 2000);
        } catch (err) {
            console.error('Report error:', err);
            setError('Không thể gửi báo cáo. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-modal-overlay">
            <div className="report-modal">
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <AlertTriangle size={32} className="warning-icon" />
                    <h2>Báo cáo lỗi phim</h2>
                </div>

                {success ? (
                    <div className="report-success">
                        <CheckCircle size={48} className="success-icon" />
                        <p>Cảm ơn bạn đã báo cáo!</p>
                        <p className="sub-text">Chúng tôi sẽ kiểm tra và khắc phục sớm nhất.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <div className="report-error">{error}</div>}

                        <div className="form-group">
                            <label>Lý do gặp phải:</label>
                            <div className="reasons-grid">
                                {reasons.map((r) => (
                                    <div
                                        key={r}
                                        className={`reason-chip ${reason === r ? 'active' : ''}`}
                                        onClick={() => setReason(r)}
                                    >
                                        {r}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Mô tả chi tiết (không bắt buộc):</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ví dụ: Phim bị đứng ở phút 15:30..."
                                rows={3}
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-report-btn"
                            disabled={loading}
                        >
                            {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
