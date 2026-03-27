Design a modern SaaS-style web application for managing competition certificates and bulk email delivery.

## Product Context

This system is used for academic competitions and olympiads.

Typical workflow:

1. Organizer has a student participant list in Google Sheets.
2. Organizer has a list of awards / results.
3. Organizer receives one PDF file containing many certificates, with one certificate per page.
4. The system splits the PDF into individual certificates.
5. The system extracts certificate information from each page.
6. The system matches each certificate to the correct student row in Google Sheets.
7. The system uploads each split certificate PDF to Google Drive.
8. The system writes the file URL back to the correct row in Google Sheets.
9. The system allows reviewing the matched list before sending emails.
10. The system supports bulk email sending with certificate attachments or Drive links.

## Main Goal

Create a desktop-first admin dashboard UI for competition organizers.

The UI should feel professional, efficient, and safe for handling hundreds of students and certificates.

---

## Information Architecture

Create the app with a left sidebar and a main content area.

### Left Sidebar Navigation

* Dashboard
* Competitions
* Student Data
* Certificate Processing
* Match & Review
* Drive Sync
* Email Campaigns
* Logs
* Settings

---

## Top Header

* Competition selector dropdown
* Google connection status
* User avatar
* Notification bell
* "New Process" primary button

---

## Main Dashboard Sections

### 1. Competition Setup Page

Purpose: configure a competition before processing certificates.

Components:

* Competition name
* Academic year / season
* Competition type
* Subject / category
* Email template selection
* Folder naming rule
* File naming rule

Cards:

* Google Sheets source connection
* Google Drive destination folder connection
* Gmail / Apps Script / email service connection

Show connection cards with:

* connected account
* sync status
* last sync time
* reconnect button

---

### 2. Student Data Page

Purpose: show participant and award data imported from Google Sheets.

Layout:

* large table view
* top filter bar
* sync button

Columns:

* Row Number
* Student ID
* Student Name
* Email
* School
* Grade
* Subject
* Award
* Certificate Code
* Certificate File URL
* Mail Status
* Notes

Features:

* search by student name, email, certificate code
* filter by subject, award, mail status
* sort columns
* highlight rows missing email
* highlight rows missing certificate URL
* inline editing for notes
* sync from Google Sheets button
* export current view button

---

### 3. Certificate Processing Page

Purpose: upload a certificate PDF and process it.

Top area:

* drag-and-drop upload zone for one or multiple PDF files
* button: "Upload Certificate PDF"
* uploaded file cards showing:

  * file name
  * pages
  * upload time
  * processing status

Processing options:

* Split only
* Split + Extract
* Split + Extract + Match to Students
* Full pipeline: Split + Extract + Upload Drive + Update Sheet

Additional toggles:

* Detect duplicate certificate code
* Normalize student names
* Normalize school names
* Run validation rules
* Overwrite existing Drive link if already present
* Save unmatched certificates to a separate folder

Primary CTA:

* "Process Certificates"

Show a horizontal progress stepper:

1. Upload
2. Split Pages
3. Extract Data
4. Match Students
5. Upload to Drive
6. Update Google Sheet
7. Ready for Email

---

### 4. Split Preview / Certificate Review Page

Purpose: preview each split certificate after processing.

Layout:
Two-column workspace.

#### Left Panel

* selected certificate PDF page preview
* zoom controls
* previous / next page
* page thumbnails in a vertical strip
* raw extracted text in collapsible section

#### Right Panel

Editable metadata form:

* Certificate Type
* Subject
* Student Name
* Grade
* Award
* School Name
* Certificate Code
* Qualified Round
* Source PDF name
* Output file name preview
* Google Drive folder destination

Validation box:

* show detected issues
* typo warning
* duplicate code warning
* unmatched student warning
* school name contains "|" warning
* filename collision warning

Actions:

* Save corrections
* Mark as unmatched
* Re-run match
* Open Drive file
* Open linked Sheet row

---

### 5. Match & Review Page

Purpose: confirm mapping between extracted certificate data and student rows.

This page is critical and should feel like a review queue.

Layout:
Top summary cards:

* Total certificates processed
* Matched successfully
* Unmatched
* Warnings
* Ready to upload
* Ready to email

Main area:
A comparison table with side-by-side matching.

Columns:

* Certificate Preview Thumbnail
* Extracted Student Name
* Extracted Award
* Extracted Subject
* Extracted Certificate Code
* Matched Student Row
* Matched Student Name
* Matched Email
* Match Confidence
* Drive Upload Status
* Sheet Update Status
* Review Status

Features:

* confidence badges: High / Medium / Low
* filters: unmatched only, warnings only, reviewed only
* bulk accept matches
* bulk mark unmatched
* manual row picker dropdown for fixing wrong match
* quick compare modal

Add a split panel detail drawer when clicking a row:

* left = certificate details
* right = student row details from sheet

Actions:

* Approve selected
* Approve all high-confidence matches
* Send selected to Drive
* Update selected Sheet rows

---

### 6. Drive Sync Page

Purpose: manage certificate file uploads and sheet updates.

Layout:
dashboard cards + activity table

Cards:

* Drive Folder Destination
* Total Uploaded
* Pending Uploads
* Failed Uploads
* Sheet Rows Updated
* Update Failures

Activity table columns:

* Student Name
* Certificate Code
* Output File Name
* Drive Upload Status
* Drive File URL
* Sheet Row Number
* Sheet Update Status
* Last Attempt
* Error Message

Features:

* retry failed uploads
* retry failed sheet updates
* open Drive folder
* copy file URL
* reconnect Google Drive / Apps Script
* choose mapping field for matching sheet row:

  * certificate code
  * student id
  * email
  * name + award + subject

Include a visual mapping settings card:

* Google Sheet ID
* Worksheet name
* Column for student name
* Column for email
* Column for award
* Column for certificate code
* Column for file URL
* Column for mail status

---

### 7. Email Campaigns Page

Purpose: bulk send emails to students after certificates are ready.

Layout:
three-panel workflow

#### Top Summary

* Total recipients
* Ready to send
* Missing certificate
* Missing email
* Sent
* Failed

#### Left Panel: Recipient Filters

* filter by competition
* filter by award
* filter by subject
* filter by status
* unmatched only
* missing email only

#### Center Panel: Recipient List

Columns:

* checkbox
* student name
* email
* award
* subject
* certificate attached / drive link status
* mail status

#### Right Panel: Email Composer

Components:

* email template selector
* subject line input
* rich text body
* merge tags helper:

  * {{student_name}}
  * {{award}}
  * {{subject}}
  * {{certificate_link}}
  * {{school_name}}
  * {{competition_name}}

Options:

* send as attachment
* send as Drive link
* CC organizer
* schedule send
* send test email to self

Buttons:

* Preview email
* Save template
* Send selected
* Send all ready recipients

Show email preview modal with rendered merge fields.

---

### 8. Logs / Audit Page

Purpose: track every automation step for transparency.

Tabs:

* Processing Logs
* Upload Logs
* Sheet Update Logs
* Email Logs
* Errors Only

Columns:

* Timestamp
* Action
* Student Name
* Certificate Code
* Result
* Details
* Retry button

Add an audit timeline component for a single student:

* matched
* uploaded to Drive
* sheet updated
* email sent

---

### 9. Settings Page

Purpose: configure system behavior.

Sections:

#### File Naming Rules

* Pretty file name format
* Safe system file name format
* max file length
* transliterate Vietnamese characters toggle

#### Matching Rules

* exact certificate code match
* exact student id match
* fuzzy student name match
* award + subject verification
* confidence threshold slider

#### Validation Rules

* detect typo "Qualifed"
* detect uppercase/lowercase anomalies
* detect school name contains "|"
* detect missing award
* detect duplicate file names
* detect duplicate certificate code

#### Integrations

* Google Drive API
* Google Sheets API
* Google Apps Script
* Gmail / email service
* webhook endpoint

---

## Key UX Requirements

* desktop-first layout (1440px)
* clean admin dashboard design
* modern SaaS interface
* high information density but easy to scan
* lots of table views with strong filtering
* clear status badges and progress indicators
* support large batches like 100–1000 students
* allow inline correction before final sync or email send

---

## Important UI Components

Please include these components in the design:

* drag-and-drop PDF uploader
* progress stepper
* certificate thumbnail strip
* side-by-side review panel
* spreadsheet-like results table
* status badges
* validation warning chips
* Drive sync status card
* email composer with merge tags
* log timeline
* modal for previewing a certificate and email

---

## Suggested Status Colors

* Blue = processing / connected
* Green = success / matched / uploaded / sent
* Yellow = warning / needs review
* Red = error / failed / unmatched
* Gray = pending / not started

---

## Visual Style

* minimal and modern
* clean white and light gray surfaces
* blue primary accent
* soft shadows
* rounded corners 10px–14px
* Inter font or similar
* professional B2B SaaS look
* suitable for education and operations teams

---

## Deliverables to Generate in the UI

Please generate multiple app screens or frames for:

1. Dashboard overview
2. Student Data table
3. Certificate Processing page
4. Split Preview / Review page
5. Match & Review page
6. Drive Sync page
7. Email Campaign page
8. Logs page
9. Settings page
