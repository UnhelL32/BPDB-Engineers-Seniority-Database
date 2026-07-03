# BPDB Engineers Seniority Database App

A modern, elegant, and user-friendly web-based database application designed to manage, search, and analyze the seniority records of engineers at the Bangladesh Power Development Board (BPDB).

Developed and branded by **Md. Minhajul Haque, Sub Divisional Engineer, BPDB-17**.

---

## 🔑 Secure Access Gateway
For security and privacy, the application begins with an authentication gate:
* **User ID:** `BPDB`
* **Password:** `Engineers`

---

## 📊 Core Features

### 1. Interactive Analytics Dashboard
* **Metrics Summary Panel:** Displays total active engineers, upcoming PRL (Age 58) list, total delayed promotions (active only), and retired engineers (Age 59+) separately. Cards act as shortcuts to pre-filtered lists in the database.
* **Assistant Engineers Stagnation Alert:** A high-priority alert highlight illustrating the count of Assistant Engineers, delayed promotions, and the stagnation percentage. It contextualizes how delay rates correlate directly with demotivation and junior engineers leaving BPDB.
* **Engineers by Designation Widget:** Hierarchical rank list indicating the number of active engineers in each of the 9 ranks.
* **Promotion Delay Chart:** An interactive grouped bar chart displaying the **Minimum**, **Maximum**, **Average (Mean)**, and **Median** delay (in years) across active engineering tiers (retired engineers are excluded to preserve chart utility).

### 2. Seniority Database List
* **Seniority Sort Chain:** Pre-sorted hierarchically where the highest tier is at the top and Assistant Engineers are at the bottom:
  $$\text{Chairman} \succ \text{Member} \succ \text{Chief Engineer} \succ \text{Additional Chief Engineer} \succ \text{Additional Chief (In Charge)} \succ \text{Superintendent} \succ \text{XEN \& Assistant Chief} \succ \text{SDE} \succ \text{Assistant Engineer}$$
* **Multiple Sort Options:** Supports sorting naturally by Rank + ID serial, or by Organizational Joining Date (Senior to Junior or Junior to Senior) to obtain the actual seniority order.
* **Color-Coded Badges:** Distinct colors for all 9 tiers for instant visual recognition.
* **Smart Search & Filters:**
  * Real-time search across Name, ID Code, Office, and original designation.
  * Filters for Rank, PRL status, and Promotion delay.
* **Full CRUD Management:** Modals to **Add**, **Edit**, and **Delete** engineer entries. All operations are automatically persisted in the browser's `localStorage`.

---

## 📐 Scientific & System Rules Applied

### 1. PRL (Post Retirement Leave) Date & Retirement Status
Calculated dynamically as:
$$\text{PRL Date} = \text{Date of Birth} + 59\text{ years}$$
* **Upcoming PRL:** Flagged when an engineer's current age is exactly **58 years** (in their last year of active service).
* **Retired Status:** Triggered dynamically when age is **59 years or older**. Retired engineers are:
  * Excluded from active count cards and delayed promotion stats.
  * Highlighted in the database list with a strikethrough effect and dimmed rows.
  * Tagged with a custom grey **Retired** badge.
* **Chairman Service Extension (Exception):** The Chairman (Code: `1-0940`, DOB: `1967-06-07`) is granted a 1-year service extension from his actual PRL Date, keeping his status as "Extended Service" (Active operational status) on the dashboard and in the database until June 7, 2027.

### 2. Delayed Promotion Thresholds (Active Only)
Tracks promotion delays based on the total service years since their **1st Joining Date** in the organization (only calculated for active, non-retired engineers):
* **Assistant Engineer (AE) $\rightarrow$ Sub-Divisional Engineer (SDE):** Delayed if service exceeds **5 years**.
* **Sub-Divisional Engineer (SDE) $\rightarrow$ Executive Engineer (XEN):** Delayed if service exceeds **10 years**.
* **Executive Engineer (XEN) $\rightarrow$ Superintendent Engineer (SE):** Delayed if service exceeds **15 years**.
* **Superintendent Engineer (SE) $\rightarrow$ Additional Chief / Chief Engineer:** Delayed if service exceeds **20 years**.
* *Delay Years Formula:* $\text{Delay} = \text{Service Years} - \text{Rank Threshold Limit}$

---

## 🛠️ How to Run Locally

Since the application runs entirely in the browser using HTML5, Vanilla CSS, and JavaScript, it does not require complex installations:

1. Clone or download the files:
   * `index.html` (Application structure)
   * `styles.css` (Glassmorphism layout)
   * `app.js` (Calculation & logic script)
   * `engineers-data.js` (Compiled database of 1,231 records)
2. Run a simple local server in the folder:
   ```bash
   python -m http.server 8000
   ```
3. Open your web browser and go to:
   [http://localhost:8000](http://localhost:8000)
