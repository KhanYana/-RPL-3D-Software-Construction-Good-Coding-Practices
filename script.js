"use strict";

const storageKey = "internshipSharingBoardJobs";
const jobForm = document.getElementById("jobForm");
const jobTableBody = document.getElementById("jobTableBody");
const emptyState = document.getElementById("emptyState");
const formFeedback = document.getElementById("formFeedback");

function getSavedJobs() {
  const savedJobs = localStorage.getItem(storageKey);

  if (savedJobs === null) {
    return [];
  }

  const parsedJobs = JSON.parse(savedJobs);
  if (!Array.isArray(parsedJobs)) {
    throw new Error("Format data lowongan di browser tidak valid.");
  }

  return parsedJobs;
}

function saveSavedJobs(savedJobs) {
  localStorage.setItem(storageKey, JSON.stringify(savedJobs));
}

function validateJobInput(job) {
  const requiredValues = [
    job.jobTitle,
    job.companyName,
    job.workType,
    job.duration,
    job.deadline,
    job.applicationLink
  ];

  if (requiredValues.some(function (value) {
    return !value.trim();
  })) {
    return "Semua kolom wajib diisi.";
  }

  const deadlineDate = new Date(job.deadline + "T00:00:00");
  if (Number.isNaN(deadlineDate.getTime()) || formatDate(deadlineDate) !== job.deadline) {
    return "Tenggat waktu tidak valid.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (deadlineDate < today) {
    return "Tenggat waktu tidak boleh sebelum hari ini.";
  }

  try {
    const applicationUrl = new URL(job.applicationLink);
    if (applicationUrl.protocol !== "http:" && applicationUrl.protocol !== "https:") {
      return "Link pendaftaran harus menggunakan http atau https.";
    }
  } catch {
    return "Link pendaftaran harus berupa URL yang valid.";
  }

  return "";
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function renderJobList() {
  const savedJobs = getSavedJobs();
  jobTableBody.replaceChildren();
  emptyState.hidden = savedJobs.length > 0;

  savedJobs.forEach(function (job) {
    const row = document.createElement("tr");
    const jobCell = document.createElement("td");
    const jobName = document.createElement("strong");
    const companyName = document.createElement("div");
    const workDetails = createCell(job.workType + " / " + job.duration);
    const deadlineCell = createCell(job.deadline);
    const linkCell = document.createElement("td");
    const applicationLink = document.createElement("a");
    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");

    jobName.textContent = job.jobTitle;
    companyName.textContent = job.companyName;
    jobCell.append(jobName, companyName);

    applicationLink.href = job.applicationLink;
    applicationLink.textContent = "Buka link";
    applicationLink.target = "_blank";
    applicationLink.rel = "noopener noreferrer";
    applicationLink.className = "applicationLink";
    linkCell.appendChild(applicationLink);

    statusBadge.className = "statusBadge";
    statusBadge.textContent = job.status;
    statusCell.appendChild(statusBadge);

    row.append(jobCell, workDetails, deadlineCell, linkCell, statusCell);
    jobTableBody.appendChild(row);
  });
}

function showFeedback(message, feedbackType) {
  formFeedback.textContent = message;
  formFeedback.className = "feedback" + (feedbackType ? " " + feedbackType : "");
}

jobForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(jobForm);
  const job = {
    jobTitle: String(formData.get("jobTitle")).trim(),
    companyName: String(formData.get("companyName")).trim(),
    workType: String(formData.get("workType")).trim(),
    duration: String(formData.get("duration")).trim(),
    deadline: String(formData.get("deadline")).trim(),
    applicationLink: String(formData.get("applicationLink")).trim(),
    status: "Menunggu Verifikasi"
  };

  const validationMessage = validateJobInput(job);
  if (validationMessage) {
    showFeedback(validationMessage, "error");
    return;
  }

  try {
    const savedJobs = getSavedJobs();
    savedJobs.push(job);
    saveSavedJobs(savedJobs);
    renderJobList();
    jobForm.reset();
    showFeedback("Lowongan berhasil dikirim dan menunggu verifikasi.", "success");
  } catch (error) {
    showFeedback("Gagal menyimpan atau menampilkan lowongan: " + error.message, "error");
  }
});

try {
  renderJobList();
} catch (error) {
  showFeedback("Gagal memuat data: " + error.message, "error");
}
