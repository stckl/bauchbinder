## Bauchbinder

Companion module for controlling Bauchbinder - a Lower Thirds software for live streams.

### Configuration

- **Bauchbinder IP**: The IP address of the computer running Bauchbinder (default: 127.0.0.1)
- **Port**: The port Bauchbinder is running on (default: 5001)
- **Poll Interval**: How often to check the status (default: 1000ms)

### Actions

- **Show Lower Third**: Display a lower third by selecting from a dropdown list (names are loaded from Bauchbinder)
- **Show Lower Third (by ID)**: Display a lower third by entering a numeric ID manually
- **Hide Lower Third**: Hide the currently active lower third
- **Toggle Lower Third**: Show if hidden, hide if the same one is already shown

### Feedbacks

- **Lower Third Active**: Changes button style when a specific lower third is active
  - Select "(Any lower third)" to trigger when any lower third is active
  - Or select a specific lower third from the dropdown
- **Lower Third Inactive**: Changes button style when no lower third is active

### Variables

- `$(bauchbinder:active_id)`: ID of the currently active lower third
- `$(bauchbinder:active_name)`: Name of the currently active lower third
- `$(bauchbinder:active_title)`: Title of the currently active lower third
- `$(bauchbinder:item_count)`: Total number of lower thirds available
- `$(bauchbinder:is_active)`: "true" or "false" indicating if any lower third is active

### Example Setup

1. Add a Bauchbinder connection in Companion
2. Enter the IP and port of your Bauchbinder instance
3. Create buttons with "Show Lower Third" actions - the dropdown will show all available lower thirds by name
4. Add "Lower Third Active" feedback to each button, selecting the matching lower third
5. Create a "Hide" button with the "Hide Lower Third" action and "Lower Third Inactive" feedback

### Dynamic Updates

The module automatically loads the list of available lower thirds from Bauchbinder. When you add or rename lower thirds in Bauchbinder, the dropdown lists in Companion will update automatically.
