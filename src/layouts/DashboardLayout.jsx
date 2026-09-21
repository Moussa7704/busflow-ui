import { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { Layout, Menu, Button, Dropdown, Avatar } from "antd";
import {
    DashboardOutlined,
    CompassOutlined,
    FileTextOutlined,
    IdcardOutlined,
    ScanOutlined,
    InboxOutlined,
    CarOutlined,
    NodeIndexOutlined,
    ShopOutlined,
    TeamOutlined,
    UserSwitchOutlined,
    BankOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    UserOutlined
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { can } from "../permissions";
import { compagniesApi } from "../api/resources";

const { Sider, Header, Content } = Layout;

const sections = [
    {
        label: "Vue d'ensemble",
        items: [
            { to: "/", label: "Tableau de bord", moduleKey: "dashboard", icon: <DashboardOutlined /> }
        ]
    },
    {
        label: "Exploitation",
        items: [
            { to: "/voyages", label: "Voyages", moduleKey: "trips", icon: <CompassOutlined /> },
            { to: "/bookings", label: "Réservations", moduleKey: "bookings", icon: <FileTextOutlined /> },
            { to: "/tickets", label: "Tickets", moduleKey: "tickets", icon: <IdcardOutlined /> },
            { to: "/embarquement", label: "Embarquement", moduleKey: "embarquement", icon: <ScanOutlined /> },
            { to: "/courriers", label: "Courriers", moduleKey: "courriers", icon: <InboxOutlined /> }
        ]
    },
    {
        label: "Ressources",
        items: [
            { to: "/buses", label: "Bus", moduleKey: "buses", icon: <CarOutlined /> },
            { to: "/routes", label: "Routes", moduleKey: "tripRoutes", icon: <NodeIndexOutlined /> },
            { to: "/agencies", label: "Agences", moduleKey: "agencies", icon: <ShopOutlined /> },
            { to: "/passengers", label: "Passagers", moduleKey: "passengers", icon: <TeamOutlined /> }
        ]
    },
    {
        label: "Administration",
        items: [
            { to: "/users", label: "Utilisateurs", moduleKey: "users", icon: <UserSwitchOutlined /> },
            { to: "/compagnies", label: "Compagnies", moduleKey: "compagnies", icon: <BankOutlined /> }
        ]
    }
];

const DashboardLayout = () => {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [compagnyName, setCompagnyName] = useState("");
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (!user?.compagny_id) {
            setCompagnyName("");
            return;
        }
        compagniesApi.get(user.compagny_id)
            .then((res) => setCompagnyName(res.data?.name || ""))
            .catch(() => setCompagnyName(""));
    }, [user?.compagny_id]);

    const menuItems = sections
        .map((section) => {
            const items = section.items.filter((item) => can(item.moduleKey, "view", user?.role));
            if (items.length === 0) return null;
            return {
                key: section.label,
                type: "group",
                label: section.label,
                children: items.map((item) => ({
                    key: item.to,
                    icon: item.icon,
                    label: item.label
                }))
            };
        })
        .filter(Boolean);

    const siderWidth = 224;
    const siderCollapsedWidth = 80;

    return (
        <Layout className="min-h-screen">

            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                trigger={null}
                theme="dark"
                width={siderWidth}
                collapsedWidth={siderCollapsedWidth}
                style={{
                    position: "fixed",
                    insetInlineStart: 0,
                    top: 0,
                    bottom: 0,
                    height: "100vh",
                    overflow: "auto"
                }}
            >
                <div className="h-14 flex items-center px-4 text-white font-semibold border-b border-slate-800 truncate">
                    {collapsed ? "BF" : (compagnyName || "BusFlow")}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>

            <Layout style={{ marginInlineStart: collapsed ? siderCollapsedWidth : siderWidth, transition: "margin-inline-start 0.2s" }}>

                <Header className="!bg-white !px-6 h-14 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                        />
                        {/* <div className="text-sm text-slate-500">
                            Rôle : <span className="font-medium text-slate-800">{user?.role}</span>
                        </div> */}
                    </div>
                    <Dropdown
                        menu={{
                            items: [
                                { key: "profile", icon: <UserOutlined />, label: "Mon profil" },
                                { type: "divider" },
                                { key: "logout", icon: <LogoutOutlined />, label: "Déconnexion", danger: true }
                            ],
                            onClick: ({ key }) => {
                                if (key === "profile") navigate("/profile");
                                if (key === "logout") logout();
                            }
                        }}
                        placement="bottomRight"
                    >
                        <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                            <Avatar size="small" icon={<UserOutlined />} />
                            <span>{user?.role}</span>
                        </button>
                    </Dropdown>
                </Header>

                <Content className="p-6 overflow-auto">
                    <Outlet />
                </Content>

            </Layout>

        </Layout>
    );

};

export default DashboardLayout;
