import type enUS from "./en-US";

export default {
  locale: "English (Yarr!)",
  common: {
    errors: {
      giveaway_state_unavailable:
        "The treasure hunt state be unavailable, ye scurvy dog!",
    },
    winner_singular: "1 lucky pirate",
    winners_plural: "{count} lucky pirates",
    ends: "Ends its voyage",
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
        duration_too_long:
          "This treasure hunt can't sail longer than 14 days, ye scallywag!",
        duration_too_short:
          "This treasure hunt can't be shorter than 10 seconds, matey!",
        failed_to_create_message:
          "Failed to launch the treasure hunt message, arrr!",
        failed_to_start:
          "Failed to start the treasure hunt: {error}, ye bilge rat!",
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
          description: "Number of new pirates to pick (defaults to all)",
        },
      },
      errors: {
        giveaway_not_found: "That treasure hunt be lost at sea, arrr!",
        giveaway_still_running:
          "That treasure hunt still be sailin\'! Can't pick new pirates until it docks. Try stoppin\' it first, ye landlubber!",
        no_winners_available:
          "No new pirates could be picked, as there be no other crew members aboard!",
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
    savetest: {
      name: "savetest",
      description: "Test the ship's storage system",
      options: {
        type: {
          name: "type",
          description: "Type of test to run on the ship",
        },
        duration: {
          name: "duration",
          description: "How long the test alarm rings (in seconds)",
        },
        winners: {
          name: "winners",
          description: "Number of pirates to choose",
        },
        id: {
          name: "id",
          description: "The treasure hunt ID",
        },
      },
      errors: {
        unknown_test_type: "Unknown test type, ye scurvy dog!",
        missing_object_id: "Missing the ship's ID, matey!",
      },
    },
  },
} satisfies Partial<typeof enUS>;
