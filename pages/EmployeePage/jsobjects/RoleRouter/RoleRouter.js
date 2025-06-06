export default {
  routeUser: async () => {
    const res = await GetUserRole.run();
    const role = res[0]?.["Chức vụ"];

    if (role === "Admin") {
      navigateTo("AdminDashboard");
    } else if (role === "Trưởng phòng" || role === "Tổng giám đốc") {
      navigateTo("ManagerPage");
    } else {
      navigateTo("EmployeePage");
    }
  }
}
