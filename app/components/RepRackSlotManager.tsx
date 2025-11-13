'use client';

import { useState, useEffect } from 'react';
import { Widget, useUserProfile, RepRackItem } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from '@/app/utils/toast';

interface RepRackSlotManagerProps {
    widget: Widget;
    widgets: Widget[];
}

export default function RepRackSlotManager({ widget, widgets }: RepRackSlotManagerProps) {
    const { user } = useAuth();
    const { profile, saveProfile } = useUserProfile(user?.uid);
    const [repRackSlots, setRepRackSlots] = useState<RepRackItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.repRack) {
            setRepRackSlots(profile.repRack);
        } else {
            setRepRackSlots([]);
        }
    }, [profile]);

    const getWidgetInSlot = (slotIndex: number): Widget | null => {
        const slot = repRackSlots[slotIndex];
        if (!slot || slot.type !== 'widget') return null;
        return widgets.find(w => w.id === slot.refId) || null;
    };

    const handleAssignToSlot = async (slotIndex: number) => {
        if (!user) {
            showToast('Please sign in to assign widgets to reprack', 'error');
            return;
        }

        try {
            setLoading(true);
            const newRepRack = [...repRackSlots];

            // Remove widget from any existing slot
            const existingIndex = newRepRack.findIndex(
                item => item.type === 'widget' && item.refId === widget.id
            );
            if (existingIndex !== -1) {
                newRepRack.splice(existingIndex, 1);
            }

            // Add to new slot (ensure array is long enough)
            while (newRepRack.length <= slotIndex) {
                newRepRack.push({ type: 'widget', refId: '', title: '', imageUrl: '' });
            }

            // Set the widget in the slot
            newRepRack[slotIndex] = {
                type: 'widget',
                refId: widget.id,
                title: widget.title,
                imageUrl: widget.thumbnailUrl || undefined,
            };

            // Remove empty slots at the end
            while (newRepRack.length > 0 && !newRepRack[newRepRack.length - 1].refId) {
                newRepRack.pop();
            }

            if (!user) return;
            await saveProfile(user.uid, { repRack: newRepRack });
            setRepRackSlots(newRepRack);
            showToast(`Widget assigned to reprack slot ${slotIndex + 1}`, 'success');
        } catch (error) {
            console.error('Error assigning widget to reprack:', error);
            showToast('Failed to assign widget to reprack', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromSlot = async (slotIndex: number) => {
        if (!user) return;

        try {
            setLoading(true);
            const newRepRack = [...repRackSlots];
            newRepRack.splice(slotIndex, 1);

            if (!user) return;
            await saveProfile(user.uid, { repRack: newRepRack });
            setRepRackSlots(newRepRack);
            showToast('Widget removed from reprack', 'success');
        } catch (error) {
            console.error('Error removing widget from reprack:', error);
            showToast('Failed to remove widget from reprack', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isWidgetInRepRack = (): number | null => {
        const index = repRackSlots.findIndex(
            item => item.type === 'widget' && item.refId === widget.id
        );
        return index !== -1 ? index : null;
    };

    const currentSlotIndex = isWidgetInRepRack();

    return (
        <div className="reprack-slot-manager">
            <div className="reprack-header">
                <h4>Rep Rack Slots</h4>
                <p className="reprack-hint">Assign this widget to showcase slots</p>
            </div>

            <div className="reprack-slots">
                {[0, 1, 2].map((slotIndex) => {
                    const slotWidget = getWidgetInSlot(slotIndex);
                    const isCurrentWidget = slotWidget?.id === widget.id;
                    const isEmpty = !slotWidget;

                    return (
                        <div
                            key={slotIndex}
                            className={`reprack-slot-item ${isCurrentWidget ? 'active' : ''} ${isEmpty ? 'empty' : ''}`}
                        >
                            <div className="reprack-slot-header">
                                <span className="slot-number">Slot {slotIndex + 1}</span>
                                {isCurrentWidget && (
                                    <span className="slot-badge">Current</span>
                                )}
                            </div>

                            {slotWidget ? (
                                <div className="reprack-slot-content">
                                    {slotWidget.thumbnailUrl ? (
                                        <img
                                            src={slotWidget.thumbnailUrl}
                                            alt={slotWidget.title}
                                            className="slot-thumbnail"
                                        />
                                    ) : (
                                        <div className="slot-thumbnail-placeholder">
                                            <span>🖼️</span>
                                        </div>
                                    )}
                                    <div className="slot-info">
                                        <p className="slot-title">{slotWidget.title}</p>
                                        <p className="slot-description">{slotWidget.description || 'No description'}</p>
                                    </div>
                                    <div className="slot-actions">
                                        {isCurrentWidget ? (
                                            <button
                                                className="slot-action-btn remove-btn"
                                                onClick={() => handleRemoveFromSlot(slotIndex)}
                                                disabled={loading}
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                className="slot-action-btn assign-btn"
                                                onClick={() => handleAssignToSlot(slotIndex)}
                                                disabled={loading}
                                            >
                                                Replace
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="reprack-slot-empty">
                                    <span className="empty-icon">📭</span>
                                    <p>Empty Slot</p>
                                    <button
                                        className="slot-action-btn assign-btn"
                                        onClick={() => handleAssignToSlot(slotIndex)}
                                        disabled={loading}
                                    >
                                        Assign Widget
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {currentSlotIndex !== null && (
                <div className="reprack-current-assignment">
                    <p>✓ This widget is assigned to Rep Rack Slot {currentSlotIndex + 1}</p>
                </div>
            )}
        </div>
    );
}

