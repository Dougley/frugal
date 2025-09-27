import type { Translation } from "@dougley/frugal-i18n";

export default {
  locale: "English (US)",
  common: {
    errors: {
      giveaway_state_unavailable: "Giveaway state not available",
    },
    winner_singular: "1 winner",
    winners_plural: "{count} winners",
    ends: "Ends",
  },
  commands: {
    ping: {
      name: "ping",
      description: "Test the bot's latency",
      messages: {
        pinging: "🏓 Pinging...",
        error: "🏓 Pong! Could not calculate RTT.",
        success: "🏓 Pong! RTT is `{rtt}`ms",
      },
    },
    list: {
      name: "list",
      description:
        "Lists all giveaways in the server that are currently running",
      messages: {
        no_giveaways: "There are no giveaways running in this server.",
        title: "Giveaways currently running",
      },
    },
    start: {
      name: "start",
      description: "Start a giveaway in the current channel",
      options: {
        duration: {
          name: "duration",
          description: "Duration of the giveaway (e.g., 30s, 5m, 2h, 1d)",
        },
        winners: {
          name: "winners",
          description: "Number of winners",
        },
        prize: {
          name: "prize",
          description: "Prize to win",
        },
        description: {
          name: "description",
          description: "Description of the giveaway",
        },
      },
      errors: {
        invalid_duration_format:
          "Invalid duration format. Use format like: 30s, 5m, 2h, 1d",
        duration_too_long_premium:
          "Maximum giveaway duration for premium users is {maxDays} days.",
        duration_too_long: "Giveaways can't be longer than 14 days",
        duration_too_short: "Giveaways can't be shorter than 10 seconds",
        failed_to_create_message: "Failed to create giveaway message",
        failed_to_start: "Failed to start giveaway: {error}",
      },
      messages: {
        success:
          "Giveaway for **{prize}** with {winners} winner(s) has been created and will run for {duration}!",
      },
    },
    stop: {
      name: "stop",
      description: "Stop a running giveaway",
      options: {
        id: {
          name: "id",
          description: "ID of the giveaway to stop",
        },
      },
      errors: {
        giveaway_not_found:
          "That giveaway does not exist or has already expired.",
      },
      messages: {
        success: "Giveaway stopped successfully! Drawing winners...",
      },
    },
    edit: {
      name: "edit",
      description: "Edit a giveaway",
      options: {
        id: {
          name: "id",
          description: "ID of the giveaway to edit",
        },
      },
      errors: {
        giveaway_not_found: "That giveaway does not exist or has expired.",
      },
    },
    reroll: {
      name: "reroll",
      description: "Reroll a giveaway",
      options: {
        id: {
          name: "id",
          description: "ID of the giveaway to reroll",
        },
        count: {
          name: "count",
          description: "Number of winners to reroll (defaults to all)",
        },
      },
      errors: {
        giveaway_not_found: "That giveaway does not exist.",
        giveaway_still_running:
          "That giveaway is still running. You can't reroll it until it ends. Try stopping it first.",
        no_winners_available:
          "No new winners could be drawn, as there were no (other) entries.",
      },
      messages: {
        partial_success_singular:
          "🎉 A new winner has been drawn!\nCongratulations to {winners}!",
        partial_success_plural:
          "🎉 {count} new winners have been drawn!\nCongratulations to {winners}!",
        success_singular:
          "🎉 New winner has been drawn!\nCongratulations to {winners}!",
        success_plural:
          "🎉 New winners have been drawn!\nCongratulations to {winners}!",
      },
    },
    savetest: {
      name: "savetest",
      description: "Test the savestate system",
      options: {
        type: {
          name: "type",
          description: "Type of test to run",
        },
        duration: {
          name: "duration",
          description: "The duration of the test alarm (in seconds)",
        },
        winners: {
          name: "winners",
          description: "Number of winners to draw",
        },
        id: {
          name: "id",
          description: "The Durable Object ID of the giveaway",
        },
      },
      errors: {
        unknown_test_type: "Unknown test type",
        missing_object_id: "Missing object ID",
      },
      messages: {
        starting_full_test: "Starting full test...",
        full_test_started: `**Full Giveaway Test Started**
🎁 **Prize:** {prize}
👥 **Winners:** {winners}
⏱️ **Duration:** {duration} seconds
👤 **Entries:** {entries}
📌 **Status:** {status}
🆔 **Object ID:** {id}

Alarm will trigger at {endTime}`,
        alarm_started:
          "Started a test alarm that will fire in {duration} seconds! (Object ID: {id})",
        giveaway_info: `**Giveaway Information**
🎁 **Prize:** {prize}
👥 **Winners:** {winners}
👤 **Entries:** {entries}
📌 **Status:** {status}
⏱️ **End Time:** {endTime}
⌛ **Remaining:** {remaining}
🆔 **Object ID:** {id}

{entriesList}`,
        no_entries: "No entries yet.",
        entries_header: "**Entries:**",
        and_more: "...and {count} more",
      },
    },
  },
  components: {
    join_button: {
      errors: {
        invalid_giveaway_id: "Invalid giveaway ID",
        giveaway_state_unavailable:
          "Giveaway service is currently unavailable.",
        giveaway_not_found: "Giveaway not found",
        giveaway_not_open: "This giveaway is no longer accepting entries.",
        already_entered: "You have already entered this giveaway.",
        not_entered: "You are not entered in this giveaway.",
        giveaway_ended: "This giveaway has already ended.",
        rate_limited: "You are being rate limited. Please try again later.",
        unexpected_error: "An unexpected error occurred. Please try again.",
      },
      messages: {
        successfully_entered:
          "You have successfully entered the giveaway for **{prize}**!",
        successfully_left:
          "You have successfully left the giveaway for **{prize}**!",
        already_entered_leave:
          "You have already entered this giveaway. Leave instead?",
        leave_button: "Leave Giveaway",
      },
    },
    edit_modal: {
      errors: {
        giveaway_state_unavailable:
          "Giveaway service is currently unavailable.",
        giveaway_not_found: "That giveaway does not exist or has expired.",
        invalid_modal_submission: "Invalid modal submission.",
        required_fields: "Prize and winners are required fields.",
        invalid_winners_count: "Winners count must be between 1 and 50.",
        update_failed: "Failed to update giveaway: {error}",
      },
      messages: {
        update_success: "Giveaway has been updated successfully!",
      },
    },
  },
  premium: {
    upgrade_required:
      "This command requires a premium subscription. Upgrade to unlock advanced features!",
    dm_upgrade_required:
      "This command requires premium and can only be used in servers.",
    limit_exceeded:
      "You've reached the {feature} limit ({current}/{maxValue}). Upgrade to premium to increase your limit to {premiumMaxValue}!",
    feature_upgrade_nags: {
      more_winners: "🥳 Need more winners?",
      longer_duration: "⏰ Want longer giveaway durations?",
      customization: "🎨 Looking for customization options?",
      more_giveaways: "🎉 Want to run more giveaways at once?",
    },
    upgrade_cta: "Upgrade to Premium for more features!",
    upgrade_link: "https://discord.com/application-directory/YOUR_APP_ID/store",
    status: {
      active: "✨ Premium Active",
      lifetime: "lifetime subscription",
      expires: "expires {date}",
      free: "🆓 Free Tier",
    },
    errors: {
      check_failed: "Failed to check premium status",
      database_unavailable: "Premium service temporarily unavailable",
    },
    upgrade_messages: {
      feature_limited:
        "🔒 **{feature}** is limited on the free tier.\n\n📊 **Current:** {current}\n🎯 **Free Limit:** {freeLimit}\n✨ **Premium Limit:** {premiumLimit}\n\n[Upgrade to Premium](https://discord.com/application-directory/YOUR_APP_ID/store) to unlock higher limits!",
      premium_indicator: " ✨ *Premium*",
      expires_soon: " ✨ *Premium (expires {date})*",
    },
  },
  autocomplete: {
    stop: {
      winners_singular: "{winners} winner",
      winners_plural: "{winners} winners",
    },
    edit: {
      ends_text: "Ends {date} with {winners} winner",
      ends_text_plural: "Ends {date} with {winners} winners",
    },
    reroll: {
      winners_singular: "{winners} winner",
      winners_plural: "{winners} winners",
    },
  },
} satisfies Translation;
