"use client";

import dynamic from "next/dynamic";

// revinhi.com/admin/feedback - browser-only, reads the admin password from sessionStorage like /admin.
const FeedbackAdmin = dynamic(() => import("./FeedbackAdmin"), { ssr: false });

export default function AdminFeedbackPage() {
  return <FeedbackAdmin />;
}
