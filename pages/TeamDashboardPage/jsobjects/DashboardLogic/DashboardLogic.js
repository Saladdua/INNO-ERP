export default {
    getTeamsToDisplay: () => {
        const currentUserRole = appsmith.store.currentUserRole;
        const currentTeamID = appsmith.store.currentTeamID;
        const allTeams = getTeams.data || [];
        const allPairs = getEvaluationPairs.data || [];
        const myEvaluations = getMyEvaluations.data || [];

        let teamsToShow = [];

        // 1. Quyết định danh sách hiển thị
        if (currentUserRole === 'LanhDao') {
            // Lãnh đạo thấy tất cả các đội
            teamsToShow = allTeams;
        } else {
            // Các đội khác chỉ thấy các đối tác đã ghép cặp
            const partnerTeamIDs = new Set();
            allPairs.forEach(pair => {
                if (pair.TeamA_ID === currentTeamID) partnerTeamIDs.add(pair.TeamB_ID);
                if (pair.TeamB_ID === currentTeamID) partnerTeamIDs.add(pair.TeamA_ID);
            });
            teamsToShow = allTeams.filter(team => partnerTeamIDs.has(team.TeamID));
        }

        // 2. Gắn trạng thái đã đánh giá/chưa đánh giá
        return teamsToShow.map(team => {
            const hasEvaluatedThisTeam = myEvaluations.some(ev => ev.TeamID === team.TeamID);
            return {
                ...team,
                isEvaluatedByCurrentUser: hasEvaluatedThisTeam
            };
        });
    }
}
