# Baby Planning

A family records dated commitments around its babies' lives and gets pinged when one is due. Many Families exist. An Operator can belong to several Families.

## Language

**Family**:
The household this product is for. Operators, babies, reminder types, and reminders belong to a Family. Many Families exist. A Family has one timezone and at most eight Operators; Due is in that timezone. A Family ends when its last Membership ends.
_Avoid_: Workspace, account, household, group

**Operator**:
A person who can create and change reminders in a Family they belong to. A Family has one or more Operators; all are equal. One Operator can belong to several Families. Carries an optional WhatsApp number (E.164) for Delivery; not required at signup.
_Avoid_: User, member, parent, account

**Operator WhatsApp number**:
The E.164 phone number on an Operator used for Delivery. Collected in profile/settings or when first selected as a Recipient; must be verified before it can receive Delivery. One number per Operator across all Families.
_Avoid_: Phone, mobile, contact number

**Membership**:
The fact that an Operator belongs to a Family. It ends when that Operator leaves or is removed by another Operator; the last Membership ending ends the Family.
_Avoid_: Seat, invite, role, owner

**Baby**:
A child a Family is planning for. Has a display name, optional due and birth dates (at least one required at creation), and optional sex. Born once birth date is set via an explicit mark-born action.
_Avoid_: Child, kid, infant

**Reminder Type**:
A Family-scoped classification for Reminders. A new Family starts with Vaccine, Appointment, Medication, and Other; Operators can add more, rename any type, or archive unused ones. Archived types stay on existing Reminders but leave pickers.
_Avoid_: Category, tag, kind, label

**Reminder**:
A dated, typed commitment in a Family. Attached to one or more Babies. Personal (one Operator) or shared (every Operator in that Family). Recipients must be able to see it; anyone who can see it can hard-delete it (row gone), before or after Delivery. After Delivery, the Reminder stays as a completed record (`delivered_at` set) until deleted; Due, Recipients, and title are read-only.
_Avoid_: Task, todo, event, notification

**Delivered**:
A Reminder whose Delivery Twilio accepted. It remains in the table with `delivered_at` set until hard-deleted; default views show upcoming Reminders only.
_Avoid_: Sent, completed, archived, done

**Due**:
The instant a Reminder should be delivered, in the Family's timezone.
_Avoid_: Deadline, scheduled time, notify-at

**Delivery**:
The WhatsApp message sent when a Reminder is due, to the Operators chosen on that Reminder.
_Avoid_: Notification, ping, alert, text

**Recipient**:
An Operator selected on a Reminder to receive its Delivery. On a personal Reminder, only that Operator. On a shared Reminder, any Operator in the Family.
_Avoid_: Subscriber, notifier
