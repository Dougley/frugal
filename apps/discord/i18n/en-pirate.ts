import type enUS from "./en-US";

export default {
  locale: "English (Yarr!)",
  common: {
    errors: {
      guild_only: "Ye can only use this command aboard a ship (server), matey!",
      giveaway_not_found: "That treasure hunt be lost at sea, arrr!",
      giveaway_expired:
        "That treasure hunt has sailed away or be lost to Davy Jones!",
      giveaway_state_unavailable:
        "The treasure hunt service be unavailable, ye scurvy dog!",
      database_unavailable: "The ship's log be unreachable right now.",
      unexpected: "Arrr, somethin' went wrong. Try again, matey!",
      rate_limited: "Slow down, ye scallywag! Try again later.",
    },
    labels: {
      winners: "{count, plural, one {# lucky pirate} other {# lucky pirates}}",
      participants:
        "{count, plural, one {# pirate aboard} other {# pirates aboard}}",
      ends: "Sets sail until",
      ended: "Voyage ended",
    },
  },
  commands: {
    ping: {
      name: "ping",
      description: "Test this bot's sea legs",
      messages: {
        pinging: "Checkin' the waters...",
        success: "Ahoy! The voyage took `{rtt}`ms!",
        error: "Ahoy! Could not measure the distance, matey.",
      },
    },
    list: {
      name: "list",
      description: "Show all treasure hunts sailin' in these waters",
      messages: {
        title: "Active Treasure Hunts",
        no_giveaways: "No treasure hunts be sailin' in these waters, matey.",
      },
    },
    start: {
      name: "start",
      description: "Start a treasure hunt in the current channel",
      options: {
        duration: {
          name: "duration",
          description: "How long the hunt sails (e.g., 30s, 5m, 2h, 1d)",
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
        duration_too_short:
          "This treasure hunt can't be shorter than 10 seconds, matey!",
        duration_too_long:
          "This treasure hunt can't sail longer than {maxDays} days, ye scallywag!",
        winners_too_many:
          "Too many lucky pirates! Max be {max} on yer plan (premium max: {premiumMax}).",
        concurrent_limit:
          "Too many treasure hunts be already runnin' in these waters. Max be {max} (premium max: {premiumMax}).",
        failed_to_create: "Failed to launch the treasure hunt message, arrr!",
        failed_to_start:
          "Failed to start the treasure hunt: {error}, ye bilge rat!",
      },
      messages: {
        success:
          "Treasure hunt for **{prize}** with {winners} be launched and sails for {duration}!",
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
    },
    reroll: {
      name: "reroll",
      description: "Pick new lucky pirates for an ended treasure hunt",
      options: {
        id: {
          name: "id",
          description: "ID of the treasure hunt to reroll",
        },
        count: {
          name: "count",
          description: "Number of new pirates to pick (free: 1, premium: more)",
        },
      },
      errors: {
        still_running:
          "That treasure hunt still be sailin'! Stop it first, ye landlubber!",
        no_entries:
          "No new pirates could be picked, as there be no other crew members aboard!",
        count_limit_free:
          "Free crew can only reroll 1 pirate at a time. Upgrade to premium for more.",
        count_too_many: "Ye can only reroll up to {max} pirates at a time.",
      },
      messages: {
        success:
          "{count, plural, one {A new lucky pirate has been chosen!} other {# new lucky pirates have been chosen!}}\nCongratulations to {winners}, ye scallywags!",
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
        no_entitlement_scope: "No entitlement scope be available here.",
      },
      messages: {
        starting_full_test: "Startin' the savestate full test...",
        full_test_started: `**Savestate Full Test Started**
Treasure: {prize}
Winnin' Pirates: {winners}
Duration: {duration} seconds
Crew: {entries}
Status: {status}
Ship ID: {id}

Alarm be triggerin' at {endTime}`,
        alarm_started:
          "Started a test alarm that will fire in {duration} seconds! (Ship ID: {id})",
        giveaway_info: `**Treasure Hunt Information**
Treasure: {prize}
Winnin' Pirates: {winners}
Crew: {entries}
Status: {status}
End Time: {endTime}
Remainin': {remaining}
Ship ID: {id}

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
  components: {
    join_button: {
      label: "Join the Crew!",
      leave_label: "Abandon Ship!",
      errors: {
        invalid_id: "Invalid treasure hunt ID, ye landlubber!",
        not_open: "This treasure hunt be closed fer new crew members.",
        already_entered: "Ye already be part of this crew, matey!",
        not_entered: "Ye be not part of this crew, matey!",
        ended: "This treasure hunt has already ended, arrr!",
      },
      messages: {
        entered: "Ye have joined the crew for the **{prize}** treasure hunt!",
        left: "Ye have abandoned the **{prize}** treasure hunt!",
        already_entered_prompt:
          "Ye already be part of this crew. Abandon ship instead?",
      },
    },
    edit_modal: {
      button_label: "Change Course",
      title: "Change Treasure Hunt",
      fields: {
        prize: "Treasure",
        winners: "Lucky Pirates (1-50)",
        description: "Description (optional)",
      },
      errors: {
        invalid_submission: "Invalid modal submission, ye scallywag!",
        required_fields: "Treasure and lucky pirates be required fields!",
        invalid_winners: "Lucky pirates count must be between 1 and 50.",
        update_failed: "Failed to update treasure hunt: {error}",
      },
      messages: {
        success: "Treasure hunt has been updated, arrr!",
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
      title: "Treasure Hunt!",
      title_ended: "Treasure Hunt Ended!",
      prize: "Treasure",
      winners: "Lucky Pirates",
      entries: "Crew",
      hosted_by: "Hosted by Cap'n",
      enter_cta: "Click the button below to join the crew!",
      description_note: "Description from the captain",
    },
    ended: {
      no_entries:
        "The treasure hunt for **{prize}** has ended, but no lucky pirates could be chosen.\n\nThank ye to all who sailed with us!",
      no_valid_winners:
        "The treasure hunt for **{prize}** has ended, but no worthy pirates could be found.\n\nThank ye to all who sailed with us!",
      with_winners:
        "The treasure hunt for **{prize}** has ended!\n\nCongratulations to the lucky pirates: {winners}\n\nThank ye to all who sailed with us!",
      nobody_won: "Nobody found the treasure",
    },
    errors: {
      already_entered: "This pirate already be aboard this treasure hunt.",
      not_entered: "This pirate be not aboard this treasure hunt.",
      rate_limited: "Slow down, ye scallywag! Try again in {seconds} seconds.",
      invalid_state:
        "Treasure hunt must be in {expected} state, but be currently {current}.",
      reservation_failed: "Could not reserve yer treasure hunt slot, matey!",
      concurrent_limit: "Too many treasure hunts be runnin' at once!",
    },
  },
  premium: {
    required: "This feature be needin' a premium subscription, ye landlubber!",
    required_guild:
      "This feature be needin' premium and can only be used aboard a ship (server)!",
    status: {
      active: "Premium Active, arrr!",
      lifetime: "Lifetime treasure pass",
      expires: "Expires {date}",
      free: "Free Tier, ye landlubber",
    },
    limits: {
      exceeded:
        "Ye've reached the {feature} limit ({current}/{max}). Upgrade to premium for up to {premiumMax}, ye scallywag!",
    },
    upsell: {
      more_winners: "Need more lucky pirates?",
      longer_duration: "Want longer treasure hunt voyages?",
      customization: "Lookin' fer customization options, matey?",
      more_giveaways: "Want to run more treasure hunts at once?",
    },
    upgrade: {
      label: "Upgrade to Premium",
      cta: "Upgrade to Premium fer more treasures!",
    },
    errors: {
      check_failed: "Could not check yer premium papers, matey!",
      unavailable: "Premium service be unavailable right now.",
    },
  },
} satisfies Partial<typeof enUS>;
