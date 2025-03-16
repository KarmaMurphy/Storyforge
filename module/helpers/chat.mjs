export function addChatMessageContextOptions(html, options){
    let showGM = li => game.user.isGM && canvas.tokens.controlled.length > 0 && li.find(".damaging").length;
    let showPlayer = li => game.user.character && li.find(".damaging").length;

    options.push(
        {
            name: "Apply Damage to Selected",
            icon: '<i class="fas fa-bolt"></i>',
            condition: showGM,
            callback: (li) => applyDamageToSelected(li, false)
        },
        {
            name: "Apply Crit to Selected",
            icon: '<i class="fas fa-skull"></i>',
            condition: showGM,
            callback: (li) => applyCritToSelected(li)
        },
        {
            name: "Heal Selected",
            icon: '<i class="fas fa-heart"></i>',
            condition: showGM,
            callback: (li) => applyDamageToSelected(li, true)
        }
    );

    // Player-specific options
    if (!game.user.isGM) {
        options.push(
            {
                name: `Apply Damage to ${game.user.character.name}`,
                icon: '<i class="fas fa-bolt"></i>',
                condition: () => showPlayer,
                callback: (li) => applyDamageToActor(li, game.user.character, false)
            },
            {
                name: `Apply Crit to ${game.user.character.name}`,
                icon: '<i class="fas fa-skull"></i>',
                condition: () => showPlayer,
                callback: (li) => applyCritToActor(li, game.user.character)
            },
            {
                name: `Heal ${game.user.character.name}`,
                icon: '<i class="fas fa-heart"></i>',
                condition: () => showPlayer,
                callback: (li) => applyDamageToActor(li, game.user.character, true)
            }
        );
    }
}

async function applyDamageToSelected(attack, isHealing) {
    const damage = parseInt(attack.find(".damaging").attr("data-damage"));
    console.log(damage)

    for (let token of canvas.tokens.controlled) {
        let actor = token.actor;
        let deflect = actor.system.deflect.value || 0;
        let finalDamage = isHealing ? -damage : Math.max(0, damage - deflect);

        await actor.update({"system.health.value": Math.max(0, actor.system.health.value - finalDamage)});

        // **Send Notification to the Actor's Owner**
        notifyActorOwner(actor, finalDamage, isHealing);
    }
}

async function applyCritToSelected(attack) {
    const crit = parseInt(attack.find(".damaging").attr("data-crit"));

    for (let token of canvas.tokens.controlled) {
        let actor = token.actor;
        await actor.update({"system.health.value": Math.max(0, actor.system.health.value - crit)});

        // **Send Notification to the Actor's Owner**
        notifyActorOwner(actor, crit, false, true);
    }
}

async function applyDamageToActor(attack, actor, isHealing) {
    const damage = parseInt(attack.find(".damaging").attr("data-damage"));
    console.log(damage)

    let deflect = actor.system.deflect.value || 0;
    let finalDamage = isHealing ? -damage : Math.max(0, damage - deflect);

    await actor.update({"system.health.value": Math.max(0, actor.system.health.value - finalDamage)});

    // **Send Notification to the Actor's Owner**
    notifyActorOwner(actor, finalDamage, isHealing);
}

async function applyCritToActor(attack, actor) {
    const crit = parseInt(attack.find(".damaging").attr("data-crit"));

    await actor.update({"system.health.value": Math.max(0, actor.system.health.value - crit)});

    // **Send Notification to the Actor's Owner**
    notifyActorOwner(actor, crit, false, true);
}


/**
 * Notify the owner of an actor when they take damage, a critical hit, or heal.
 * @param {Actor} actor - The actor receiving damage/healing.
 * @param {number} amount - The amount of damage/healing received.
 * @param {boolean} isHealing - Whether this is healing.
 * @param {boolean} isCrit - Whether this is a critical hit.
 */
function notifyActorOwner(actor, amount, isHealing = false, isCrit = false) {
    const owners = game.users.filter(user => actor.testUserPermission(user, "OWNER"));

    if (owners.length === 0) return; // No owners to notify

    let message;
    if (isHealing) {
        amount = amount * -1;
        message = `${actor.name} has been healed for ${amount} HP!`;
    } else if (isCrit) {
        message = `${actor.name} took a **CRITICAL HIT** for an additional ${amount} damage!`;
    } else {
        message = `${actor.name} took ${amount} damage!`;
    }

    for (let user of owners) {
        if (user.id === game.user.id) {
            ui.notifications.info(message);
        } else {
            game.socket.emit("system.storyforge", { type: "notify", userId: user.id, message });
        }
    }
}

// **Listen for Notifications on the Client Side**
Hooks.on("ready", () => {
    game.socket.on("system.storyforge", data => {
        if (data.type === "notify" && data.userId === game.user.id) {
            ui.notifications.info(data.message);
        }
    });
});