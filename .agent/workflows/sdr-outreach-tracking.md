---
description: Workflow for tracking SDR outreach messages and marking replies.
---

# SDR Outreach & Reply Tracking Workflow

This workflow enables SDRs to track the performance of their generated pitches by logging sent messages and marking them when a reply is received.

## Steps

### 1. Generate and Copy Pitch
- Select the **Target Type** (e.g., Fashion Seller).
- (Optional) Enter the recipient's **Name**.
- Click **Generate On-Brand Pitch**.
- Click **Copy**. 
    - *Under the hood: The system should automatically log this as a "Sent Outreach" with a timestamp.*

### 2. View Recent Outreaches
- Navigate to the **Recent Outreaches** section below the generator.
- This table/list displays:
    - **Recipient Name**
    - **Target Type**
    - **Sent Time**
    - **Status** (Pending / Replied)

### 3. Mark as Replied
- When a reply is received on Email or Social Media:
    - Locate the specific outreach in the **Recent Outreaches** list.
    - Click the **Mark as Replied** button (checkmark icon).
    - The status will update to "Replied" and the entry will be highlighted.

### 4. Analysis
- Export the log or view the reply rate (Total Replies / Total Sent) to measure pitch effectiveness.

## Technical Implementation Guide
To implement this in `KrissKrossPitchGenerator.jsx`:
1. **Initialize State**: `const [outreaches, setOutreaches] = useState([]);`
2. **Update Copy Logic**: In `copyToClipboard`, add `setOutreaches([...outreaches, { id: Date.now(), name: customName, type: targetType, pitch: generatedPitch, timestamp: new Date(), replied: false }])`.
3. **Add Toggle Logic**: Create `const toggleReplied = (id) => { ... }` to find the item and flip the `replied` boolean.
4. **Render List**: Build a UI component to map through `outreaches` and display them with a "Mark Replied" button.
