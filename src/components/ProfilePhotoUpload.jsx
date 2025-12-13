import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, Check } from 'lucide-react';
import { useToast } from './Toast';
import './ProfilePhotoUpload.css';

const ProfilePhotoUpload = ({ currentPhoto, userId, onPhotoUpdate }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(currentPhoto || null);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const fileInputRef = useRef(null);
    const { showSuccess, showError } = useToast();

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showError('Por favor selecciona una imagen válida');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('La imagen debe ser menor a 5MB');
            return;
        }

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setShowModal(true);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result;

                // Save to Firestore (we'll store base64 in user document)
                // In production, you'd upload to Firebase Storage
                const { updateUserDocument } = await import('../services/db');
                await updateUserDocument(userId, {
                    photoURL: base64,
                    photoUpdatedAt: new Date()
                });

                showSuccess('Foto de perfil actualizada');
                setShowModal(false);
                if (onPhotoUpdate) {
                    onPhotoUpdate(base64);
                }
            };
            reader.readAsDataURL(selectedFile);

        } catch (error) {
            showError('Error al subir la foto: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = async () => {
        try {
            const { updateUserDocument } = await import('../services/db');
            await updateUserDocument(userId, {
                photoURL: null,
                photoUpdatedAt: new Date()
            });

            setPreview(null);
            setSelectedFile(null);
            setShowModal(false);
            showSuccess('Foto de perfil eliminada');
            if (onPhotoUpdate) {
                onPhotoUpdate(null);
            }
        } catch (error) {
            showError('Error al eliminar la foto: ' + error.message);
        }
    };

    const getInitials = () => {
        if (!userId) return '?';
        return userId.substring(0, 2).toUpperCase();
    };

    return (
        <div className="profile-photo-upload">
            <div className="photo-container">
                {preview ? (
                    <motion.div 
                        className="photo-preview"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <img src={preview} alt="Profile" />
                    </motion.div>
                ) : (
                    <motion.div 
                        className="photo-placeholder gradient-primary"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <span>{getInitials()}</span>
                    </motion.div>
                )}

                <motion.button
                    className="photo-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Camera size={20} />
                </motion.button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* Upload Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !uploading && setShowModal(false)}
                    >
                        <motion.div
                            className="modal-content glass"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>Actualizar Foto de Perfil</h3>
                                <button 
                                    className="modal-close"
                                    onClick={() => !uploading && setShowModal(false)}
                                    disabled={uploading}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="preview-large">
                                    <img src={preview} alt="Preview" />
                                </div>
                            </div>

                            <div className="modal-footer">
                                {currentPhoto && (
                                    <button
                                        className="btn-remove"
                                        onClick={handleRemove}
                                        disabled={uploading}
                                    >
                                        <X size={18} />
                                        Eliminar
                                    </button>
                                )}
                                <button
                                    className="btn-upload gradient-primary"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="spinner" size={18} />
                                            Subiendo...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Guardar
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePhotoUpload;
