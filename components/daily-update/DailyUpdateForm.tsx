"use client";

import ProjectSelector from "./ProjectSelector";
import TaskSelector from "./TaskSelector";
import StatusSelector from "./StatusSelector";
import HoursInput from "./HoursInput";
import CommentBox from "./CommentBox";
import AttachmentUploader from "./AttachmentUploader";
import SubmitButtons from "./SubmitButtons";

export default function DailyUpdateForm() {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8">

      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        <ProjectSelector />
        <TaskSelector />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <HoursInput />
        <StatusSelector />
      </div>

      {/* Comments */}
      <div className="mt-8">
        <CommentBox />
      </div>

      {/* Attachment */}
      <div className="mt-8">
        <AttachmentUploader />
      </div>

      {/* Buttons */}
      <div className="mt-8">
        <SubmitButtons />
      </div>

    </div>
  );
}