# BPDB-Engineers-Seniority-Database
Seniority Database of BPDB Engineers Year 2026
# BPDB Engineers Seniority Database App

A modern, elegant, and user-friendly web-based database application designed to manage, search, and analyze the seniority records of engineers at the Bangladesh Power Development Board (BPDB).

Developed and branded by **Md. Minhajul Haque, Sub Divisional Engineer, BPDB-17**.


---

## 📊 Core Features

### 1. Interactive Analytics Dashboard
* **Metrics Summary Panel:** Displays total active engineers, upcoming PRL engineers (Age 58), and total delayed promotions. Metrics cards act as shortcuts to pre-filtered lists in the database.
* **Top Postings Widget:** Renders a list of the top 10 offices/stations by engineer count.
* **Promotion Delay Chart:** An interactive grouped bar chart displaying the **Minimum**, **Maximum**, **Average (Mean)**, and **Median** delay (in years) across engineering tiers.

### 2. Seniority Database List
* **Seniority Sort Chain:** Pre-sorted hierarchically where the highest tier is at the top and Assistant Engineers are at the bottom:
  $$\text{Chairman} \succ \text{Member} \succ \text{Chief Engineer} \succ \text{Additional Chief Engineer} \succ \text{Additional Chief (In Charge)} \succ \text{Superintendent} \succ \text{XEN \& Assistant Chief} \succ \text{SDE} \succ \text{Assistant Engineer}$$
* **ID Serial Sorting:** Within each rank, engineers are naturally sorted by their Employee Code.
* **Color-Coded Badges:** Distinct colors for all 9 tiers for instant visual recognition.
* **Smart Search & Filters:**
  * Real-time search across Name, ID Code, Office, and original designation.
  * Filters for Rank, PRL status, and Promotion delay.
* **Full CRUD Management:** Modals to **Add**, **Edit**, and **Delete** engineer entries. All operations are automatically persisted in the browser's `localStorage`.

---

## 📐 Scientific & System Rules Applied

### 1. PRL (Post Retirement Leave) Date
Calculated dynamically as:
$$\text{PRL Date} = \text{Date of Birth} + 59\text{ years}$$
* **Upcoming PRL:** Flagged when an engineer's current age is exactly **58 years** (in their last year of active service).
* **Retiring/Retired:** Flagged when age is **59 years or older**.

### 2. Delayed Promotion Thresholds
Tracks promotion delays based on the total service years since their **1st Joining Date** in the organization:
* **Assistant Engineer (AE) $\rightarrow$ Sub-Divisional Engineer (SDE):** Delayed if service exceeds **5 years**.
* **Sub-Divisional Engineer (SDE) $\rightarrow$ Executive Engineer (XEN):** Delayed if service exceeds **10 years**.
* **Executive Engineer (XEN) $\rightarrow$ Superintendent Engineer (SE):** Delayed if service exceeds **15 years**.
* **Superintendent Engineer (SE) $\rightarrow$ Additional Chief / Chief Engineer:** Delayed if service exceeds **20 years**.
* *Delay Years Formula:* $\text{Delay} = \text{Service Years} - \text{Rank Threshold Limit}$

---


