# Baby Planning

A family records dated commitments around its babies' lives and gets pinged when one is due. Many Families exist. An Operator can belong to several Families.

## Language

**Family**:
The household this product is for. Operators, babies, reminder types, and reminders belong to a Family. Many Families exist. A Family has one timezone; Due is in that timezone.
_Avoid_: Workspace, account, household, group

**Operator**:
A person who can create and change reminders in a Family they belong to. A Family starts with two Operators and can have more. All Operators in a Family are equal. One Operator can belong to several Families.
_Avoid_: User, member, parent, account

**Membership**:
The fact that an Operator belongs to a Family.
_Avoid_: Seat, invite, role

**Baby**:
A child a Family is planning for. A Family can have several.
_Avoid_: Child, kid, infant

**Reminder Type**:
A Family-scoped classification for Reminders (vaccine, appointment, and others that Family adds).
_Avoid_: Category, tag, kind, label

**Reminder**:
A dated, typed commitment in a Family. Attached to one or more Babies. Personal (one Operator) or shared (every Operator in that Family). Recipients must be able to see it.
_Avoid_: Task, todo, event, notification

**Due**:
The instant a Reminder should be delivered, in the Family's timezone.
_Avoid_: Deadline, scheduled time, notify-at

**Delivery**:
The WhatsApp message sent when a Reminder is due, to the Operators chosen on that Reminder.
_Avoid_: Notification, ping, alert, text

**Recipient**:
An Operator selected on a Reminder to receive its Delivery. On a personal Reminder, only that Operator. On a shared Reminder, any Operator in the Family.
_Avoid_: Subscriber, notifier
