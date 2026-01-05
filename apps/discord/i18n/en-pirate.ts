import type enUS from "./en-US";

export default {
  locale: "English (Yarr!)",
  common: {
    errors: {
      giveaway_state_unavailable:
        "The treasure hunt state be unavailable, ye scurvy dog!",
      database_unavailable: "The ship's log be unreachable right now.",
    },
    winner_singular: "1 lucky pirate",
    winners_plural: "{count} lucky pirates",
    ends: "Ends its voyage",
  },
  premium: {
    errors: {
      check_failed: "Could not check yer premium papers, matey!",
      database_unavailable: "Premium service be unavailable right now.",
    },
  },
  commands: {
    ping: {
      name: "ping",
      description: "Test this bot's sea legs",
      messages: {
        pinging: "🏓 Checkin' the waters...",
        error: "🏓 Ahoy! Could not measure the distance, matey.",
        success: "🏓 Ahoy! The voyage took `{rtt}`ms!",
      },
    },
    list: {
      name: "list",
      description: "Show all treasure hunts sailin' in these waters",
      errors: {
        guild_only:
          "Ye can only use this command aboard a ship (server), matey!",
      },
      messages: {
        no_giveaways: "No treasure hunts be sailin' in these waters, matey.",
        title: "Treasure hunts currently sailin'",
      },
    },
    start: {
      name: "start",
      description: "Start a treasure hunt",
      options: {
        duration: {
          name: "duration",
          description: "How long the hunt runs (e.g., 30s, 5m, 2h, 1d)",
        },
        winners: {
          name: "winners",
          description: "Number of lucky pirates",
        },
        prize: {
          name: "prize",
          description: "The treasure to be won",
        },
        description: {
          name: "description",
          description: "Tell us about this treasure hunt",
        },
      },
      errors: {
        invalid_duration_format:
          "Arrr! Invalid time format, ye landlubber! Use: 30s, 5m, 2h, 1d",
        duration_too_long_premium:
          "Premium treasure hunts can sail up to {maxDays} days, matey!",
        duration_too_long:
          "This treasure hunt can't sail longer than 14 days, ye scallywag!",
        duration_too_short:
          "This treasure hunt can't be shorter than 10 seconds, matey!",
        winners_too_many:
          "Too many lucky pirates! Max be {max} on yer plan (premium max: {premiumMax}).",
        failed_to_create_message:
          "Failed to launch the treasure hunt message, arrr!",
        failed_to_start:
          "Failed to start the treasure hunt: {error}, ye bilge rat!",
        concurrent_giveaways_limit_exceeded:
          "Too many treasure hunts be already runnin' in these waters. Max be {freeMax} (premium max: {premiumMax}).",
        guild_only: "Ye can only use this command in a server.",
      },
      messages: {
        success:
          "Treasure hunt for **{prize}** with {winners} winner(s) be launched and sails for {duration}!",
      },
    },
    stop: {
      name: "stop",
      description: "Stop a treasure hunt that be sailin'",
      options: {
        id: {
          name: "id",
          description: "ID of the treasure hunt to stop",
        },
      },
      errors: {
        giveaway_not_found: "That treasure hunt has sailed away, matey!",
      },
      messages: {
        success: "Treasure hunt stopped! Time to pick the lucky pirates, arrr!",
      },
    },
    edit: {
      name: "edit",
      description: "Change the course of a treasure hunt",
      options: {
        id: {
          name: "id",
          description: "ID of the treasure hunt to change",
        },
      },
      errors: {
        giveaway_not_found: "That treasure hunt has sailed away or expired.",
      },
    },
    reroll: {
      name: "reroll",
      description: "Pick new lucky pirates for a treasure hunt",
      options: {
        id: {
          name: "id",
          description: "ID of the treasure hunt to reroll",
        },
        count: {
          name: "count",
          description:
            "Number of new pirates to pick (free defaults to 1; premium can pick more/all)",
        },
      },
      errors: {
        giveaway_not_found: "That treasure hunt be lost at sea, arrr!",
        giveaway_still_running:
          "That treasure hunt still be sailin'! Can't pick new pirates until it docks. Try stoppin' it first, ye landlubber!",
        no_winners_available:
          "No new pirates could be picked, as there be no other crew members aboard!",
        count_limit_free:
          "Free crew can only reroll 1 pirate at a time. Upgrade to premium to reroll more pirates.",
        count_too_many: "Ye can only reroll up to {max} pirates at a time.",
        unexpected: "Arrr, somethin' went wrong.",
      },
      messages: {
        partial_success_singular:
          "🎉 A new lucky pirate has been chosen!\nCongratulations to {winners}, ye scallywag!",
        partial_success_plural:
          "🎉 {count} new lucky pirates have been chosen!\nCongratulations to {winners}, ye scallywags!",
        success_singular:
          "🎉 New lucky pirate has been chosen!\nCongratulations to {winners}, arrr!",
        success_plural:
          "🎉 New lucky pirates have been chosen!\nCongratulations to {winners}, ye hearties!",
      },
    },
    debug: {
      name: "debug",
      description: "Spyglass fer diagnostics",
      options: {
        action: {
          name: "action",
          description: "Which debug trick to run",
        },
        duration: {
          name: "duration",
          description: "How long the test alarm rings (in seconds)",
        },
        winners: {
          name: "winners",
          description: "Number o' pirates to choose",
        },
        id: {
          name: "id",
          description: "The ship's Durable Object ID",
        },
        entries: {
          name: "entries",
          description: "How many test crew to conjure (default: 10)",
        },
        scope: {
          name: "scope",
          description: "Entitlements scope (guild/user/both)",
        },
        limit: {
          name: "limit",
          description: "Max entitlement rows (default: 10)",
        },
      },
      errors: {
        not_allowed: "This command be only fer the development guild, matey!",
        unknown_action: "Unknown debug action, ye scallywag!",
        missing_object_id: "Missing the ship's ID, matey!",
        giveaway_not_found: "That treasure hunt be lost at sea, arrr!",
        no_entitlement_scope: "No entitlement scope be available here",
        unexpected: "Somethin' went wrong, arrr.",
      },
      messages: {
        starting_full_test: "Startin' the savestate full test...",
        full_test_started: `**Savestate Full Test Started**
🎁 **Treasure:** {prize}
👥 **Winnin' Pirates:** {winners}
⏱️ **Duration:** {duration} seconds
👤 **Crew:** {entries}
📌 **Status:** {status}
🆔 **Ship ID:** {id}

Alarm be triggerin' at {endTime}`,
        alarm_started:
          "Started a test alarm that will fire in {duration} seconds! (Ship ID: {id})",
        giveaway_info: `**Treasure Hunt Information**
🎁 **Treasure:** {prize}
👥 **Winnin' Pirates:** {winners}
👤 **Crew:** {entries}
📌 **Status:** {status}
⏱️ **End Time:** {endTime}
⌛ **Remainin':** {remaining}
🆔 **Ship ID:** {id}

{entriesList}`,
        no_entries: "No crew aboard yet.",
        entries_header: "**Crew:**",
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
  giveaway: {
    ended: {
      no_winners:
        "😔 The treasure hunt for **{prize}** has ended, but no lucky pirates could be chosen.\n\nThank ye to all who sailed with us!",
      no_valid_winners:
        "😔 The treasure hunt for **{prize}** has ended, but no worthy pirates could be found.\n\nThank ye to all who sailed with us!",
      with_winners:
        "🎉 The treasure hunt for **{prize}** has ended!\n\nCongratulations to the lucky pirates: {winners}\n\nThank ye to all who sailed with us!",
      nobody_won: "Nobody found the treasure",
    },
    errors: {
      not_found: "Treasure hunt not found, arrr!",
      already_entered: "This pirate already be aboard this treasure hunt",
      not_entered: "This pirate be not aboard this treasure hunt",
      rate_limited: "Slow down, ye scallywag! Try again in {seconds} seconds.",
      invalid_state_single:
        "Treasure hunt must be in {state} state, but be currently {current}",
      invalid_state_multiple:
        "Treasure hunt must be in one of these states: {states}. Currently {current}",
      reservation_db_error: "Could not reserve yer treasure hunt slot, matey!",
      concurrent_limit_exceeded: "Too many treasure hunts be runnin' at once!",
    },
  },
} satisfies Partial<typeof enUS>;
