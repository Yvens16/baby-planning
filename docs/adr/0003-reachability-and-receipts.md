# Recipients need not be reachable; Delivery is one Receipt per Recipient

Ticket: [How does an Operator become reachable for Delivery?](https://github.com/Yvens16/baby-planning/issues/30)

An Operator is reachable via live Devices (push), not a WhatsApp number. Anyone who can see a Reminder can be a Recipient; the form warns if they are unreachable, without saying why. Delivery fans out to every live Device of Recipients who lack a Receipt. The Reminder is Delivered when every Recipient has a Receipt (empty Recipients stay due). The first Receipt freezes Due, title, Reminder Type, and Babies so later Recipients see the same copy; Recipients stay editable so an unreachable Operator can be dropped. Sign-out ends this Device only; settings can forget any Device.

**Considered options:** Hard-gating Recipients on a live Device was rejected — the selector cannot grant the Recipient’s permission. Resending every tick until all Recipients land was rejected as spam. Marking Delivered on the first accepted send was rejected because unreachable Recipients would never be pinged. One Device per Operator was rejected — phone and laptop are both real. Freezing Recipients at first Receipt was rejected — dropping someone unreachable is how a Reminder completes when they will not grant.

**Consequences:** Schema holds Device rows and Receipts. A banner asks on each session after they belong to a Family until granted or denied. iOS Home Screen is a permission prerequisite. Copy of the push is composed at send time from the frozen fields ([What does the push say?](https://github.com/Yvens16/baby-planning/issues/31)).
