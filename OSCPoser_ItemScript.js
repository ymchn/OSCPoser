$.onStart(() => {
    $.log("onStart()");

    $.state.players = [];
});

$.onUpdate((deltaTime) => {
    // known players (Player Script has been set)
    let players = $.state.players;
    // current players (existing on the space just now)
    let cur_players = $.getPlayersNear(new Vector3(0, 0, 0), Infinity);

    // pick up players who are not set Player Script
    const new_players = cur_players.filter(cur_p => {
        return !players.some(p => p.id === cur_p.id);
    });

    // set Player Script
    for (const player of new_players) {
        // dirty countermeasure: sometimes player handle returns null data
        if (!player || !player.userId) {
            continue;
        }

        $.setPlayerScript(player);
        players.push(player);

        const user_name = player.userDisplayName;
        const user_id = player.userId;
        $.log("set Player Script to " + user_name +
              " (@" + user_id + ")");
    }

    // filtering non-existent players
    players = players.filter(p => p.exists());

    $.state.players = players;
});
