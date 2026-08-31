# Create and join live on the Family name sheet

Ticket: [Where does an Operator who already has a Family create another or join?](https://github.com/Yvens16/baby-planning/issues/37)

An Operator who already has a Membership creates another Family or pastes an invite from the Family **name** sheet, not from settings or reminder chrome. The name is always tappable (chevron always). The switch *list* still appears only when Memberships > 1. Create (name + timezone) and paste-join replace the picker in the same sheet; success switches into that Family. Dirty add/edit uses the same stay-vs-discard confirm as switch. `GET /join/{token}` remains the tappable-link path.

**Considered options:** Settings / overflow gear was rejected — that surface does not exist, and create/join are Family-level like switch. Reminder-home overflow was rejected as easy to miss. Picker-only (hidden when Memberships = 1) was rejected because the common one-Family Operator would have no door. Link-only join (no paste) was rejected — a copied URL would have nowhere to go except the address bar.
