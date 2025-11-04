"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, XCircle } from "lucide-react"

interface Course {
  id: string
  title: string
  instructor: string
  category: string
  submittedDate: string
  status: "pending" | "approved" | "rejected"
  description: string
}

interface CourseApprovalModalProps {
  course: Course
  isOpen: boolean
  onClose: () => void
  onApprove: () => void
  onReject: (reason: string) => void
}

export function CourseApprovalModal({ course, isOpen, onClose, onApprove, onReject }: CourseApprovalModalProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  if (!isOpen) return null

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason)
      setRejectionReason("")
      setIsRejecting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
          <h2 className="text-2xl font-bold text-foreground">Review Course</h2>
          <button onClick={onClose} className="p-1 hover:bg-background rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Course Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">{course.title}</h3>
              <p className="text-muted-foreground mt-2">Instructor: {course.instructor}</p>
              <p className="text-muted-foreground">Category: {course.category}</p>
              <p className="text-muted-foreground">Submitted: {new Date(course.submittedDate).toLocaleDateString()}</p>
            </div>

            <div className="bg-background rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Description</h4>
              <p className="text-foreground">{course.description}</p>
            </div>
          </div>

          {/* Rejection Form */}
          {isRejecting && (
            <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900">Rejection Reason</h4>
              <textarea
                placeholder="Explain why this course is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-24"
              />
            </div>
          )}

          {/* Review Checklist */}
          <div className="space-y-3 p-4 bg-background rounded-lg border border-border">
            <h4 className="font-medium text-foreground">Review Checklist</h4>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-foreground">Course title is clear and descriptive</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-foreground">Description explains learning outcomes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-foreground">Category is appropriate</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-foreground">Instructor credentials are verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-foreground">No inappropriate content</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {!isRejecting ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsRejecting(true)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button onClick={onApprove} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsRejecting(false)}>
                  Cancel Rejection
                </Button>
                <Button onClick={handleReject} disabled={!rejectionReason.trim()} className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Submit Rejection
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
