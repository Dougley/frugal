import type { Translation } from "@dougley/frugal-i18n";

export default {
  locale: "English (US)",

  common: {
    errors: {
      guild_only: "This command can only be used in a server.",
      giveaway_not_found: "That giveaway does not exist.",
      giveaway_expired: "That giveaway does not exist or has expired.",
      giveaway_state_unavailable: "Giveaway service is currently unavailable.",
      database_unavailable: "Database temporarily unavailable.",
      unexpected: "An unexpected error occurred. Please try again.",
      rate_limited: "You are being rate limited. Please try again later.",
    },
    labels: {
      winners: "{count, plural, one {# winner} other {# winners}}",
      participants:
        "{count, plural, one {# participant} other {# participants}}",
      ends: "Ends",
      ended: "Ended",
    },
  },

  commands: {
    ping: {
      name: "ping",
      description: "Test the bot's latency",
      messages: {
        pinging: "Pinging...",
        success: "Pong! RTT is `{rtt}`ms",
        error: "Pong! Could not calculate RTT.",
      },
    },

    list: {
      name: "list",
      description:
        "Lists all giveaways in the server that are currently running",
      messages: {
        title: "Active Giveaways",
        no_giveaways: "There are no giveaways running in this server.",
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
        duration_too_short: "Giveaways can't be shorter than 10 seconds.",
        duration_too_long: "Giveaways can't be longer than {maxDays} days.",
        winners_too_many:
          "Too many winners. Max is {max} on your plan (premium max: {premiumMax}).",
        concurrent_limit:
          "Too many giveaways are already running in this server. Max is {max} (premium max: {premiumMax}).",
        failed_to_create: "Failed to create giveaway message.",
        failed_to_start: "Failed to start giveaway: {error}",
      },
      messages: {
        success:
          "Giveaway for **{prize}** with {winners} has been created and will run for {duration}!",
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
    },

    reroll: {
      name: "reroll",
      description: "Reroll winners for an ended giveaway",
      options: {
        id: {
          name: "id",
          description: "ID of the giveaway to reroll",
        },
        count: {
          name: "count",
          description: "Number of winners to reroll (free: 1, premium: more)",
        },
      },
      errors: {
        still_running:
          "That giveaway is still running. Stop it first before rerolling.",
        no_entries:
          "No new winners could be drawn, as there were no (other) entries.",
        count_limit_free:
          "Free users can only reroll 1 winner at a time. Upgrade to premium for more.",
        count_too_many: "You can only reroll up to {max} winners at a time.",
      },
      messages: {
        success:
          "{count, plural, one {A new winner has been drawn!} other {# new winners have been drawn!}}\nCongratulations to {winners}!",
      },
    },

    debug: {
      name: "debug",
      description: "Debug and diagnostics",
      options: {
        action: {
          name: "action",
          description: "What debug action to run",
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
        entries: {
          name: "entries",
          description: "Number of test entries to generate (default: 10)",
        },
        scope: {
          name: "scope",
          description: "Entitlement scope (guild/user/both)",
        },
        limit: {
          name: "limit",
          description: "Max entitlement rows (default: 10)",
        },
      },
      errors: {
        not_allowed: "This command is only available in the development guild.",
        unknown_action: "Unknown debug action.",
        missing_object_id: "Missing object ID.",
        no_entitlement_scope: "No entitlement scope available in this context.",
      },
      messages: {
        starting_full_test: "Starting savestate full test...",
        full_test_started: `**Savestate Full Test Started**
Prize: {prize}
Winners: {winners}
Duration: {duration} seconds
Entries: {entries}
Status: {status}
Object ID: {id}

Alarm will trigger at {endTime}`,
        alarm_started:
          "Started a test alarm that will fire in {duration} seconds! (Object ID: {id})",
        giveaway_info: `**Giveaway Information**
Prize: {prize}
Winners: {winners}
Entries: {entries}
Status: {status}
End Time: {endTime}
Remaining: {remaining}
Object ID: {id}

{entriesList}`,
        no_entries: "No entries yet.",
        entries_header: "**Entries:**",
        and_more: "...and {count} more",
        premium_status: `**Premium Status**
- hasPremium: {hasPremium}
- source: {source}
- isLifetime: {isLifetime}
- expiresAt: {expiresAt}
- entitlementType: {entitlementType}
- entitlementId: {entitlementId}
- skuId: {skuId}
- isTest: {isTest}`,
        entitlements: `**Entitlements ({count})** (scope: {scope})
{rows}`,
      },
    },
  },

  components: {
    join_button: {
      label: "Enter Giveaway",
      leave_label: "Leave Giveaway",
      errors: {
        invalid_id: "Invalid giveaway ID.",
        not_open: "This giveaway is no longer accepting entries.",
        already_entered: "You have already entered this giveaway.",
        not_entered: "You are not entered in this giveaway.",
        ended: "This giveaway has already ended.",
      },
      messages: {
        entered: "You have successfully entered the giveaway for **{prize}**!",
        left: "You have successfully left the giveaway for **{prize}**!",
        already_entered_prompt:
          "You have already entered this giveaway. Leave instead?",
      },
    },

    edit_modal: {
      button_label: "Edit Giveaway",
      title: "Edit Giveaway",
      fields: {
        prize: "Prize",
        winners: "Winners (1-50)",
        description: "Description (optional)",
      },
      errors: {
        invalid_submission: "Invalid modal submission.",
        required_fields: "Prize and winners are required fields.",
        invalid_winners: "Winners count must be between 1 and 50.",
        update_failed: "Failed to update giveaway: {error}",
      },
      messages: {
        success: "Giveaway has been updated successfully!",
      },
    },
  },

  autocomplete: {
    giveaway: {
      format: "{prize} - {winners} - Ends {date}",
    },
  },

  giveaway: {
    embed: {
      title: "Giveaway!",
      title_ended: "Giveaway Ended!",
      prize: "Prize",
      winners: "Winners",
      entries: "Entries",
      hosted_by: "Hosted by",
      enter_cta: "Click the button below to enter!",
      description_note: "Description provided by the host",
    },

    ended: {
      no_entries:
        "The giveaway for **{prize}** has ended, but no winners could be drawn.\n\nThank you to everyone who participated!",
      no_valid_winners:
        "The giveaway for **{prize}** has ended, but no valid winners could be determined.\n\nThank you to everyone who participated!",
      with_winners:
        "The giveaway for **{prize}** has ended!\n\nCongratulations to the winners: {winners}\n\nThank you to everyone who participated!",
      nobody_won: "Nobody won",
    },

    errors: {
      already_entered: "User has already entered this giveaway.",
      not_entered: "User has not entered this giveaway.",
      rate_limited: "Rate limited. Try again in {seconds} seconds.",
      invalid_state:
        "Giveaway must be in {expected} state, but is currently {current}.",
      reservation_failed: "Failed to reserve giveaway slot.",
      concurrent_limit: "Too many concurrent giveaways.",
    },
  },

  premium: {
    required: "This feature requires a premium subscription.",
    required_guild:
      "This feature requires premium and can only be used in servers.",

    status: {
      active: "Premium Active",
      lifetime: "Lifetime subscription",
      expires: "Expires {date}",
      free: "Free Tier",
    },

    limits: {
      exceeded:
        "You've reached the {feature} limit ({current}/{max}). Upgrade to premium for up to {premiumMax}!",
    },

    upsell: {
      more_winners: "Need more winners?",
      longer_duration: "Want longer giveaway durations?",
      customization: "Looking for customization options?",
      more_giveaways: "Want to run more giveaways at once?",
    },

    upgrade: {
      label: "Upgrade to Premium",
      cta: "Upgrade to Premium for more features!",
    },

    errors: {
      check_failed: "Failed to check premium status.",
      unavailable: "Premium service temporarily unavailable.",
    },
  },
} satisfies Translation;
