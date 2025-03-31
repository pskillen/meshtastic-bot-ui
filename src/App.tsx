import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { NodesList } from "@/pages/nodes/NodesList"
import { NodeMap } from "@/pages/map/NodeMap"
import { MessageHistory } from "@/pages/messages/MessageHistory"
import { Settings } from "@/pages/settings/Settings"
import { Dashboard } from "@/pages/Dashboard"
import { NodeDetails } from '@/pages/nodes/NodeDetails'

function App() {
  return (
    <Router>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/nodes" element={<NodesList />} />
                <Route path="/nodes/:id" element={<NodeDetails />} />
                <Route path="/map" element={<NodeMap />} />
                <Route path="/messages" element={<MessageHistory />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Router>
  )
}

export default App
