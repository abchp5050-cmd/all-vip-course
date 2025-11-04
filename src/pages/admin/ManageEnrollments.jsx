import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, query, orderBy, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { CheckCircle, XCircle, Trash2, Clock, Phone, Hash, DollarSign, User, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";

export default function ManageEnrollments() {
  const { currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState({});
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch enrollments
      let enrollmentsQuery;
      if (filter === "ALL") {
        enrollmentsQuery = query(collection(db, "enrollments"), orderBy("createdAt", "desc"));
      } else {
        enrollmentsQuery = query(
          collection(db, "enrollments"),
          where("status", "==", filter),
          orderBy("createdAt", "desc")
        );
      }
      
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrollmentsData = enrollmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEnrollments(enrollmentsData);

      // Fetch courses
      const coursesSnapshot = await getDocs(collection(db, "courses"));
      const coursesData = {};
      coursesSnapshot.docs.forEach(doc => {
        coursesData[doc.id] = { id: doc.id, ...doc.data() };
      });
      setCourses(coursesData);

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = {};
      usersSnapshot.docs.forEach(doc => {
        usersData[doc.id] = { id: doc.id, ...doc.data() };
      });
      setUsers(usersData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      toast.error("Failed to load enrollments");
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    if (!confirm("Are you sure you want to approve this enrollment?")) return;

    try {
      const response = await fetch("/api/update-enrollment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          status: "APPROVED",
          adminId: currentUser.uid
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Enrollment approved successfully");
        fetchData();
      } else {
        toast.error(data.error || "Failed to approve enrollment");
      }
    } catch (error) {
      console.error("Error approving enrollment:", error);
      toast.error("Failed to approve enrollment");
    }
  };

  const handleReject = async (enrollmentId) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return;

    try {
      const response = await fetch("/api/update-enrollment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          status: "REJECTED",
          adminId: currentUser.uid,
          rejectionReason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Enrollment rejected");
        fetchData();
      } else {
        toast.error(data.error || "Failed to reject enrollment");
      }
    } catch (error) {
      console.error("Error rejecting enrollment:", error);
      toast.error("Failed to reject enrollment");
    }
  };

  const handleDelete = async (enrollmentId) => {
    if (!confirm("Are you sure you want to delete this enrollment? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "enrollments", enrollmentId));
      toast.success("Enrollment deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      toast.error("Failed to delete enrollment");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200"
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading) {
    return <div className="p-8 text-center">Loading enrollments...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Manage Enrollments</h1>
        
        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-border">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium transition border-b-2 ${
                filter === status
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Enrollments List */}
      {enrollments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p>No {filter.toLowerCase()} enrollments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const course = courses[enrollment.courseId];
            const user = users[enrollment.userId];
            
            return (
              <div
                key={enrollment.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left: Enrollment Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                      {enrollment.telegramJoinedAt && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          Telegram Joined
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-primary" />
                        <span className="text-muted-foreground">User:</span>
                        <span className="font-medium text-card-foreground">
                          {user?.displayName || user?.email || "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen size={16} className="text-primary" />
                        <span className="text-muted-foreground">Course:</span>
                        <span className="font-medium text-card-foreground">
                          {course?.title || "Unknown Course"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-primary" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium text-card-foreground">
                          {enrollment.paymentInfo?.phoneNumber || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Hash size={16} className="text-primary" />
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono text-sm text-card-foreground">
                          {enrollment.paymentInfo?.transactionId || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={16} className="text-primary" />
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium text-card-foreground">
                          ৳{enrollment.paymentInfo?.amount || course?.price || "0"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-primary" />
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="text-card-foreground">
                          {enrollment.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                        </span>
                      </div>
                    </div>

                    {enrollment.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">Rejection Reason:</span> {enrollment.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex lg:flex-col gap-2">
                    {enrollment.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(enrollment.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <CheckCircle size={18} />
                          <span className="hidden sm:inline">Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(enrollment.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          <XCircle size={18} />
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(enrollment.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition"
                    >
                      <Trash2 size={18} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
