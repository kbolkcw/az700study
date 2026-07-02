/* AZ-700 exam content, structured by the official skills-measured outline
   (learn.microsoft.com/.../study-guides/az-700 — version effective 27 Jul 2026).
   Each component is presented as a Who/What/When/Where/Why/How ("5W1H") card. */

const DOMAINS = [
  {
    id: "core",
    name: "Design and implement core networking infrastructure",
    weightMin: 25, weightMax: 30,
    colorVar: "--series-1",
    components: [
      {
        id: "ip-vnet",
        title: "IP Addressing & Virtual Networks",
        summary: "The address plan and VNet/subnet layout every other networking service sits inside — get this wrong and everything downstream breaks.",
        what: [
          "A Virtual Network (VNet) is an isolated, software-defined network in one Azure region with a private IPv4/IPv6 address space (RFC1918 or custom/BYOIP prefixes), segmented into subnets.",
          "Subnets can be dedicated (delegated to a service like Azure Firewall, Bastion, App Gateway, VNet-integrated PaaS) or shared by multiple resources.",
          "Public IPs (Basic/Standard SKU) and Public IP Prefixes give resources internet-reachable addresses; Custom IP Prefixes let you bring your own public range (BYOIP) into Azure."
        ],
        why: [
          "Every Azure resource needing network connectivity must live in a subnet, so address planning is the first design decision.",
          "Non-overlapping address spaces are required before you can peer VNets, connect on-premises, or build hub-and-spoke topologies."
        ],
        who: ["Network engineer/architect owns the IP address plan and subnet layout.", "Cloud admins provision VNets/subnets from that plan; app teams request delegated subnets for PaaS services."],
        when: ["At the very start of any landing zone or workload design — before any gateway, firewall, or peering exists.", "Whenever a new service needs a dedicated subnet, or the org needs a bigger address block."],
        where: ["Regional resource — a VNet lives in exactly one region (can span its availability zones).", "Sits at the bottom of the stack: routing, peering, gateways and NSGs all attach to a VNet/subnet."],
        how: ["Plan non-overlapping CIDRs per hub/spoke, reserve subnets for gateways (/27 min VPN GW), Firewall (/26), Bastion (/26), App Gateway.", "Create via Portal/CLI/PowerShell/Bicep/ARM; delegate subnets used by platform services; attach a Standard Public IP/Prefix to internet-facing resources."]
      },
      {
        id: "dns",
        title: "Azure DNS (Public/Private Zones) + DNS Private Resolver",
        summary: "Name resolution for Azure — public zones for internet-facing names, private zones (+resolver) so on-prem and Azure can resolve each other.",
        what: [
          "Azure DNS hosts public zones (authoritative internet resolution) and private zones (VNet-scoped resolution, optional auto-registration).",
          "Azure DNS Private Resolver is a managed bridge for hybrid DNS between on-prem and Azure — no self-hosted DNS forwarder VMs needed."
        ],
        why: ["Private endpoints and internal services need private, VNet-scoped resolution that never leaks to the public internet.", "Hybrid scenarios need on-prem servers to resolve Azure private names and vice versa."],
        who: ["Network/platform engineer configures zones, VNet links and the resolver; mostly transparent to app teams."],
        when: ["Public zone: hosting internet-facing DNS for a domain in Azure.", "Private zone: required for Private Link/Private Endpoint DNS integration.", "Private Resolver: whenever hybrid DNS resolution is required."],
        where: ["Public zones are global (anycast); private zones resolve only for explicitly linked VNets; resolver endpoints deploy per-region into a VNet/subnet."],
        how: ["Create a private zone (e.g. privatelink.blob.core.windows.net), link it to the relevant VNet(s).", "Deploy Private Resolver with an inbound endpoint (on-prem→Azure) and an outbound endpoint + forwarding ruleset (Azure→on-prem)."]
      },
      {
        id: "peering",
        title: "VNet Peering & Azure Virtual Network Manager",
        summary: "Peering wires VNets together at the network layer (incl. gateway transit); Virtual Network Manager governs peering/security centrally at scale.",
        what: [
          "VNet Peering connects two VNets (same region or Global) over the Microsoft backbone — private, low-latency, no gateway/public IP needed.",
          "Gateway transit lets a spoke use the hub's VPN/ExpressRoute gateway instead of deploying its own.",
          "Azure Virtual Network Manager (AVNM) centrally manages connectivity (mesh/hub-spoke) and security admin rules across many VNets/subscriptions via network groups."
        ],
        why: ["Hub-and-spoke is the standard landing zone topology — spokes reach shared services via gateway transit.", "AVNM removes manual peering/NSG maintenance across hundreds of VNets."],
        who: ["Network architect designs the topology; platform team operates AVNM once scale demands it."],
        when: ["Peering: connecting a spoke to a hub or any two VNets needing private traffic.", "AVNM: once manual peering/NSG management no longer scales."],
        where: ["Peering is regional or global; traffic stays on Microsoft's private backbone, never the public internet."],
        how: ["Enable 'Allow gateway transit' on the hub, 'Use remote gateway' on the spoke; peering is non-transitive by default (spoke-to-spoke needs its own peering, an NVA, Route Server, or Virtual WAN).", "In AVNM: define a network group, a connectivity configuration (mesh/hub-spoke) and security admin rules, then deploy."]
      },
      {
        id: "routing",
        title: "User-Defined Routes (UDR) & Azure Route Server",
        summary: "UDRs override Azure's default routing (e.g. force traffic through a firewall/NVA); Route Server lets NVAs exchange BGP routes natively, no UDR upkeep.",
        what: [
          "A Route Table holds UDRs and attaches to subnet(s); each route maps a prefix to a next hop (Virtual appliance, VNet gateway, Internet, None, VNet Local).",
          "Forced tunneling sends all outbound traffic (0.0.0.0/0) to an on-prem/NVA next hop instead of the internet.",
          "Azure Route Server is a managed BGP speaker in a VNet that peers with NVAs/gateways so routes propagate automatically."
        ],
        why: ["Azure's default system routes route directly between subnets/peered VNets/internet — UDRs are needed whenever traffic must be inspected or redirected.", "Route Server removes the operational burden of keeping UDRs in sync as NVA routes change."],
        who: ["Network engineer designs/troubleshoots route tables; security engineer usually mandates firewall/NVA transit."],
        when: ["UDR: traffic needs to bypass the default system route, e.g. forcing spoke egress through a central Firewall.", "Route Server: an NVA needs dynamic BGP route exchange without manual UDR upkeep."],
        where: ["Route tables attach to subnets (regional). Route Server deploys into its own RouteServerSubnet (/27 min)."],
        how: ["Create a Route Table, add UDRs, associate to subnet(s); use Effective Routes in Network Watcher to diagnose.", "Deploy Route Server into RouteServerSubnet, peer NVAs over BGP, optionally enable branch-to-branch."]
      },
      {
        id: "natgw",
        title: "Azure NAT Gateway",
        summary: "A managed, highly-available outbound-only NAT for a subnet — simpler and more scalable than Load Balancer SNAT for internet egress.",
        what: ["A fully managed NAT service attached to one or more subnets, giving static, predictable outbound-only internet connectivity via one or more Standard Public IPs/Prefixes."],
        why: ["Solves SNAT port exhaustion seen with Load Balancer outbound rules and gives a stable, whitelist-able outbound IP without a Load Balancer or Firewall.", "Simplifies outbound-only scenarios (VMSS, AKS nodes pulling images) where inbound balancing isn't needed."],
        who: ["Network/platform engineer attaches NAT Gateway to subnets as part of the egress design."],
        when: ["A subnet's resources need reliable, scalable outbound internet access and SNAT exhaustion or a full Firewall/LB isn't wanted."],
        where: ["Subnet-level resource, regional, zonal or zone-redundant depending on the Public IP SKU."],
        how: ["Create a NAT Gateway, associate Standard Public IP(s)/Prefix, associate to target subnet(s) — no route table changes needed, it becomes the default outbound path."]
      },
      {
        id: "monitor",
        title: "Network Watcher & Azure Monitor for Networks (+DDoS/Defender)",
        summary: "The diagnostic and monitoring toolbox for the whole network stack: topology, connectivity tests, flow logs, DDoS telemetry, and Defender for Cloud posture.",
        what: [
          "Network Watcher: IP flow verify, next hop, effective routes/NSG rules, Connection Monitor, NSG/VNet flow logs, packet capture.",
          "Azure Monitor for Networks aggregates health/topology/metrics across networking resources in one place.",
          "Azure DDoS Protection (Standard) auto-mitigates attacks on public IPs; Defender for Cloud adds Secure Score, attack path analysis and Cloud Security Explorer for network resources."
        ],
        why: ["Troubleshooting connectivity and proving security posture both need visibility beyond individual resource blades."],
        who: ["Network engineer/NOC uses these daily for troubleshooting; security engineer reviews Defender findings and DDoS telemetry."],
        when: ["Continuously for monitoring/alerting; on-demand (IP flow verify, next hop, packet capture) when actively troubleshooting."],
        where: ["Network Watcher is enabled per region; flow logs target NSGs/VNets, analyzed via Log Analytics/Traffic Analytics."],
        how: ["Enable Network Watcher per region in use; turn on flow logs + Traffic Analytics; use Connection Monitor for proactive synthetic tests; enable DDoS Standard and review Defender for Cloud regularly."]
      }
    ]
  },
  {
    id: "connectivity",
    name: "Design, implement, and manage connectivity services",
    weightMin: 20, weightMax: 25,
    colorVar: "--series-2",
    components: [
      {
        id: "s2s-vpn",
        title: "Site-to-Site VPN (VPN Gateway)",
        summary: "An IPsec/IKE tunnel between an Azure VPN Gateway and an on-prem VPN device — quick to deploy, internet-based hybrid connectivity.",
        what: [
          "A VPN Gateway in a dedicated GatewaySubnet builds an encrypted IPsec/IKE tunnel over the public internet to an on-prem device, represented in Azure by a Local Network Gateway.",
          "Policy-based (legacy, static selectors) vs route-based (recommended default — supports BGP, multiple tunnels, ExpressRoute coexistence)."
        ],
        why: ["Fast, relatively cheap encrypted hybrid connectivity without a private circuit — good for smaller sites, DR, or an ExpressRoute backup."],
        who: ["Network engineer configures the gateway/local network gateway; needs coordination with the on-prem network/security team."],
        when: ["Need encrypted hybrid connectivity quickly, budget rules out ExpressRoute, or as an ExpressRoute failover path.", "Also used for VNet-to-VNet when peering isn't suitable (e.g. cross-tenant)."],
        where: ["Gateway in GatewaySubnet (/27 min) of the hub VNet; tunnel endpoints are public IPs, traffic crosses the (encrypted) public internet."],
        how: ["Size a Gateway SKU (VpnGw1-5 / AZ SKUs for zone redundancy), create the Local Network Gateway with on-prem IP + prefixes, define an IPsec/IKE policy if needed, create the connection; use active-active gateways/dual devices for HA."]
      },
      {
        id: "p2s-vpn",
        title: "Point-to-Site VPN",
        summary: "Individual client machines connect straight into a VNet over VPN — for remote/road-warrior users, not site connectivity.",
        what: ["Lets individual devices connect directly into a VNet via a VPN Gateway configured with a P2S client address pool.", "Supports OpenVPN, IKEv2, SSTP (Windows); auth via certificates, Microsoft Entra ID, or RADIUS."],
        why: ["Secure remote access without a full site VPN device — common for small teams, developers, or emergency admin access."],
        who: ["Network/identity engineer configures the gateway and auth method; end users install the VPN client."],
        when: ["Individual remote users need access, not whole sites; also used with Always On VPN or Azure Network Adapter for managed Windows devices."],
        where: ["Same GatewaySubnet as S2S (can coexist on one gateway); client traffic terminates at the gateway's public endpoint."],
        how: ["Pick tunnel type + auth method; for certs, generate/upload a root cert; for Entra ID, register the Azure VPN client app; for RADIUS, point the gateway at an on-prem RADIUS/NPS server; users download the generated VPN profile."]
      },
      {
        id: "expressroute",
        title: "Azure ExpressRoute",
        summary: "A private, dedicated circuit into Microsoft's network via a connectivity provider — bypasses the public internet for the highest SLA/throughput hybrid option.",
        what: [
          "A private Layer 3 connection from on-prem into Microsoft's network via a provider (CloudExchange, point-to-point Ethernet, IPVPN, or ExpressRoute Direct for customer-owned fiber).",
          "Private peering (VNet access), Microsoft peering (M365/PaaS public endpoints privately); Global Reach links two ER sites; FastPath bypasses the gateway for data-path performance."
        ],
        why: ["Needed for the highest bandwidth, lowest/predictable latency, highest security, or contractual SLA — large enterprises, regulated industries, heavy data migration."],
        who: ["Network architect designs circuit/SKU/redundancy; requires a connectivity provider relationship, usually run by network ops."],
        when: ["High-throughput, latency-sensitive or compliance-driven hybrid connectivity; often paired with S2S VPN as an encrypted backup (ER isn't encrypted by default)."],
        where: ["Circuit terminates at a Microsoft edge via the provider; the ER Gateway lives in the VNet's GatewaySubnet like a VPN gateway."],
        how: ["Choose connectivity model + provider, SKU/tier (Local/Standard/Premium) and Gateway SKU (Standard/HighPerf/UltraPerf/ErGw1-3AZ), configure private/Microsoft peering (BGP), link via an ER Gateway, optionally enable FastPath, Global Reach, encryption; use BFD for fast failure detection."]
      },
      {
        id: "vwan",
        title: "Azure Virtual WAN",
        summary: "Microsoft-managed hub that consolidates VPN, ExpressRoute, Point-to-Site and inter-VNet routing/transitivity into one 'networking as a service' construct.",
        what: ["Managed hub-and-spoke overlay: virtual hubs (Microsoft-managed) host VPN/ExpressRoute/P2S gateways plus automatic any-to-any transitive routing between spokes/branches.", "Standard SKU adds routing intent/policies, secured hubs (Firewall/NVA via Firewall Manager), and third-party NVA integration."],
        why: ["Solves VNet peering's non-transitivity and the overhead of hand-building/maintaining a hub VNet at scale — Microsoft manages the hub's scale units and HA."],
        who: ["Network architect designs the topology (hub placement, routing intent); platform team operates it centrally."],
        when: ["Large/global orgs with many branch offices, VPN/ExpressRoute sites and VNets that all need any-to-any connectivity without manual mesh peering."],
        where: ["Virtual hubs are regional; one Virtual WAN resource can span many regions/hubs globally over the Microsoft backbone."],
        how: ["Create a Virtual WAN, create a hub per region (choose a scale unit per gateway type), deploy needed gateways, configure hub routing/routing intent, optionally integrate a third-party NVA or Azure Firewall (secured hub)."]
      }
    ]
  },
  {
    id: "delivery",
    name: "Design and implement application delivery services",
    weightMin: 15, weightMax: 20,
    colorVar: "--series-3",
    components: [
      {
        id: "lb-tm",
        title: "Azure Load Balancer & Traffic Manager",
        summary: "Load Balancer distributes traffic at L4 within/across a region; Traffic Manager is DNS-based global routing across regions/endpoints.",
        what: [
          "Load Balancer (L4/TCP-UDP): Public or Internal, Regional or Cross-region tier, distributing via rules + health probes, optional inbound NAT / outbound rules for SNAT.",
          "Gateway Load Balancer transparently inserts third-party NVAs into the traffic path (chaining).",
          "Traffic Manager is a DNS-based global router (not in the data path): priority, weighted, performance, geographic, MultiValue, subnet routing methods."
        ],
        why: ["Load Balancer: distribute traffic across VMs/VMSS for scale/HA at the transport layer, protocol-agnostic and low-latency.", "Traffic Manager: route users to the closest/healthiest of multiple regional deployments purely via DNS."],
        who: ["Network/platform engineer configures both; app teams define backend pools."],
        when: ["Load Balancer: any multi-instance backend needing L4 distribution.", "Traffic Manager: multi-region active-active/passive architectures needing DNS-level failover/geo-routing, especially for non-HTTP protocols."],
        where: ["Load Balancer is regional (or cross-region SKU for global L4); Traffic Manager is global, DNS-only, no data plane."],
        how: ["Choose Standard SKU, public/internal, regional/cross-region; define backend pool, health probe, LB rule (+ optional NAT/outbound rules); chain a Gateway Load Balancer for NVA inspection.", "Traffic Manager: create a profile, pick a routing method, add endpoints with health checks."]
      },
      {
        id: "appgw",
        title: "Azure Application Gateway",
        summary: "A regional Layer 7 (HTTP/S) load balancer/reverse-proxy with path-based routing, TLS termination, and an integrated WAF option.",
        what: ["Managed L7 load balancer: listeners (public/private, basic/multi-site), routing rules (path-based/basic), backend pools, HTTP settings, health probes, TLS termination/end-to-end TLS, rewrite rule sets, optional WAF (v2) SKU."],
        why: ["Needed when routing/inspection must be based on HTTP content (URL path, host header), not just TCP/UDP — e.g. multiple web apps behind one gateway, central TLS offload."],
        who: ["Network/app platform engineer configures it; app teams supply backend pool endpoints and expected HTTP behavior."],
        when: ["Any internal or internet-facing web workload needing L7 routing, SSL offload, or WAF protection within a single region."],
        where: ["Regional resource in its own dedicated subnet; v2 SKU supports autoscaling and zone redundancy."],
        how: ["Choose Standard v2 or WAF v2, manual or autoscale, create backend pool(s), health probes, HTTP settings, listeners, routing rules, configure TLS and optional rewrite rule sets."]
      },
      {
        id: "frontdoor",
        title: "Azure Front Door",
        summary: "A global, edge-based L7 entry point combining CDN-style caching/acceleration, WAF, and multi-region failover — the global counterpart to Application Gateway.",
        what: ["Global, Anycast-based delivery service at Microsoft's edge PoPs: routing across origins/origin groups, TLS termination/end-to-end TLS, caching, traffic acceleration, URL rewrite/redirect, secured origins via Private Link."],
        why: ["Needed for global internet-facing apps needing edge caching/acceleration, WAF at the edge closest to attackers, and automatic failover across multiple regional origins."],
        who: ["Network/platform engineer designs origin groups/routing; security engineer attaches WAF policies."],
        when: ["Global-facing web apps/APIs needing CDN-like performance plus L7 routing/failover across regions — often paired with regional Application Gateways as origins."],
        where: ["Global, edge/PoP-based, not tied to one Azure region; origins can be Azure or external endpoints."],
        how: ["Choose Standard or Premium tier, configure an endpoint, origin group(s) with health probes/priority/weight, routes (patterns → origin group, caching, protocol), TLS/caching, attach a WAF policy, use Private Link to keep origins non-internet-exposed."]
      }
    ]
  },
  {
    id: "private-access",
    name: "Design and implement private access to Azure services",
    weightMin: 10, weightMax: 15,
    colorVar: "--series-4",
    components: [
      {
        id: "private-link",
        title: "Azure Private Link & Private Endpoints",
        summary: "Gives a PaaS service (or your own Private Link service) a private IP inside your VNet — traffic never traverses the public internet.",
        what: ["A Private Endpoint is a NIC with a private IP in your VNet/subnet mapping to a specific PaaS resource instance via Private Link.", "A Private Link Service lets you expose your own (Standard LB-fronted) service to other VNets/tenants privately, the same way Microsoft exposes PaaS services."],
        why: ["Removes the need to allow any public network access to a PaaS resource at all — reachable only via the private IP inside approved VNets, closing off internet exfiltration paths."],
        who: ["Network/security engineer provisions and approves the private endpoint connection; the PaaS resource owner approves it on their side."],
        when: ["Any scenario requiring the strongest network isolation for PaaS access, or building your own multi-tenant service that must offer private connectivity."],
        where: ["The Private Endpoint NIC lives in a subnet within your VNet; the matching privatelink.* private DNS zone is what routes traffic to it."],
        how: ["Create the Private Endpoint targeting the resource + sub-resource, approve the connection, integrate with the matching Private DNS zone.", "For your own service: front it with a Standard Load Balancer, create a Private Link Service; consumers create Private Endpoints against it."]
      },
      {
        id: "service-endpoints",
        title: "Service Endpoints",
        summary: "Extends a subnet's identity onto Azure's backbone so a PaaS resource's firewall can allow 'this subnet' directly — simpler than Private Link, keeps a public IP.",
        what: ["Enabled per subnet per service (e.g. Microsoft.Storage), routes traffic over the Azure backbone and lets the PaaS firewall restrict access to specific VNets/subnets.", "Service Endpoint Policies further restrict which specific resource instances a subnet can reach."],
        why: ["A lighter-weight alternative to Private Link when you just need to lock a PaaS firewall to 'traffic from this VNet/subnet' without a dedicated private IP per resource."],
        who: ["Network engineer enables the endpoint on the subnet; resource owner configures the matching firewall rule."],
        when: ["Cost-sensitive or simpler scenarios where Private Link's per-resource private IP/DNS integration isn't required."],
        where: ["Configured at the subnet level; the PaaS resource keeps its public endpoint but its firewall recognizes the enabled subnet(s)."],
        how: ["Enable the service endpoint for the target service on the subnet, add a VNet rule on the PaaS resource's firewall, optionally attach a Service Endpoint Policy."]
      }
    ]
  },
  {
    id: "security",
    name: "Design and implement Azure network security services",
    weightMin: 15, weightMax: 20,
    colorVar: "--series-5",
    components: [
      {
        id: "nsg-asg",
        title: "Network Security Groups & Application Security Groups",
        summary: "NSGs are stateful L3/L4 allow/deny rule sets on subnets/NICs; ASGs group VMs by role so NSG rules reference groups instead of hardcoded IPs.",
        what: ["An NSG holds inbound/outbound rules (priority, source/dest, port, protocol, allow/deny), associated to a subnet and/or NIC; defaults allow VNet-internal and Load Balancer traffic, deny everything else inbound from the internet.", "An ASG tags NICs with a logical role so NSG rules can reference the group instead of individual IPs."],
        why: ["The basic, always-available network firewall for east-west and north-south traffic control; ASGs keep rules maintainable as the fleet grows."],
        who: ["Network or security engineer authors rules; app teams request the ports/sources they need opened."],
        when: ["Virtually every production subnet/NIC should have an NSG; ASGs whenever rules would otherwise need per-IP maintenance for a role/tier."],
        where: ["Subnet-level and/or NIC-level (both can apply — most restrictive wins); regional resource."],
        how: ["Create the NSG, add rules (lowest priority number wins), associate to subnet/NIC; enable flow logs for auditing; verify via Network Watcher; scope RDP/SSH via Azure Bastion instead of open internet rules."]
      },
      {
        id: "firewall",
        title: "Azure Firewall & Firewall Manager",
        summary: "A managed, stateful L3-L7 firewall/NVA-as-a-service for centralized east-west and north-south inspection, governed at scale via Firewall Manager.",
        what: ["Azure Firewall: fully managed, HA, built-in threat intelligence; network rules (L3/L4), application rules (FQDN/L7), NAT rules (DNAT), and Premium SKU adds TLS inspection, IDPS, URL filtering.", "Firewall Manager centrally manages Firewall policies across many firewalls/hubs and deploys a 'secured hub' (Firewall inside a Virtual WAN hub)."],
        why: ["Needed for centralized, policy-driven inspection/control of outbound egress and inter-spoke traffic beyond what NSGs (no FQDN/L7 awareness) can do."],
        who: ["Security engineer/network architect designs policy; SOC/security team monitors alerts via threat intelligence and Defender for Cloud."],
        when: ["Whenever centralized, auditable egress/inter-spoke inspection is required, e.g. all spokes forced-tunnel to the internet only via the hub firewall."],
        where: ["Deployed in its own AzureFirewallSubnet (/26 min) in a hub VNet, or inside a Virtual WAN secured hub."],
        how: ["Choose SKU (Basic/Standard/Premium), deploy into AzureFirewallSubnet, attach a Firewall Policy (ordered rule collections), point spoke UDRs at the Firewall's private IP; use Firewall Manager for multi-firewall/hub-wide policy."]
      },
      {
        id: "waf",
        title: "Web Application Firewall (WAF)",
        summary: "An L7 rule engine (OWASP Core Rule Set + custom rules) that sits on Application Gateway or Front Door specifically to catch web-app attacks like SQLi/XSS.",
        what: ["A WAF policy (managed + custom rule sets, e.g. OWASP CRS, bot protection) attached to Application Gateway (regional) or Front Door (global), running in Detection (log only) or Prevention (block) mode."],
        why: ["NSGs/Firewall don't inspect HTTP payloads — WAF specifically catches common web exploits (SQL injection, XSS, request smuggling) per the OWASP Top 10."],
        who: ["Security engineer authors/tunes the policy (custom rules, exclusions); app teams report false positives needing exclusions."],
        when: ["Any internet-facing web application/API — effectively mandatory alongside Application Gateway or Front Door in production."],
        where: ["Runs inline on Application Gateway (WAF_v2 SKU) or Front Door (Premium tier for managed rules); one policy can attach to multiple listeners/endpoints."],
        how: ["Create a WAF policy, choose a managed rule set version, start in Detection mode to baseline/tune exclusions, switch to Prevention, associate to the listener(s)/endpoint."]
      }
    ]
  }
];

const GLOSSARY = {
  "RFC1918": "The RFC that defines the private IPv4 ranges reserved for internal networks: 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.",
  "BYOIP": "Bring Your Own IP — importing a public IP range you already own into Azure instead of using an Azure-assigned range.",
  "gateway transit": "Lets a spoke VNet use the hub's VPN/ExpressRoute gateway for hybrid connectivity, instead of deploying (and paying for) its own gateway.",
  "BGP": "Border Gateway Protocol — the dynamic routing protocol used to exchange routes between on-prem devices, Route Server, and VPN/ExpressRoute gateways, so routes update automatically instead of needing manual UDRs.",
  "Forced tunneling": "Sends all outbound internet-bound traffic (0.0.0.0/0) to an on-prem or NVA next hop instead of straight to the internet, so it can be centrally inspected first.",
  "SNAT": "Source NAT — rewrites a private source IP to a public IP for outbound traffic, so replies can find their way back to the right internal host. Too many concurrent connections can exhaust available SNAT ports.",
  "Global Reach": "An ExpressRoute feature that links two separate ExpressRoute circuits together so the on-prem sites behind them can reach each other over Microsoft's network.",
  "FastPath": "An ExpressRoute data-path optimization that sends most traffic straight to the VNet, bypassing the gateway, for higher throughput and lower latency.",
  "BFD": "Bidirectional Forwarding Detection — a lightweight keepalive protocol that detects a link failure faster than BGP alone, used to speed up ExpressRoute failover.",
  "routing intent": "A Virtual WAN Standard feature where you simply declare 'send all internet/private traffic through this secured hub', instead of hand-building route tables.",
  "secured hub": "A Virtual WAN virtual hub with Azure Firewall (or a partner NVA) built in, so all traffic passing through the hub is centrally inspected.",
  "multi-site": "An Application Gateway listener mode that routes based on the HTTP Host header, letting one gateway serve multiple domains/websites (as opposed to a 'basic' single-site listener).",
  "path-based": "An Application Gateway routing rule that sends requests to different backend pools based on the URL path, e.g. /images/* to one pool and /api/* to another.",
  "TLS termination": "Ending the encrypted HTTPS connection at the load balancer/gateway itself, so it can inspect and route based on the request content.",
  "end-to-end TLS": "The connection stays encrypted all the way: client → gateway (terminated and inspected), then re-encrypted gateway → backend.",
  "Anycast": "The same IP address is announced from many edge locations at once; a user's traffic is automatically routed to the nearest one.",
  "OWASP CRS": "OWASP Core Rule Set — the maintained, generic set of web-attack detection rules (SQL injection, XSS, etc.) used by a WAF's managed rule set.",
  "IDPS": "Intrusion Detection and Prevention System — inspects traffic for known attack signatures at the network level (an Azure Firewall Premium feature).",
  "Detection mode": "A WAF operating mode that only logs rule matches without blocking anything — used to baseline/tune exclusions before switching to Prevention mode, which actively blocks matching requests.",
  "DNAT": "Destination NAT — rewrites the destination IP/port of inbound traffic, e.g. forwarding a public IP:port to an internal private IP (used for Azure Firewall DNAT rules).",
  "L3/L4": "Network (L3, IP address) and Transport (L4, TCP/UDP port) layer — a decision based only on IP/port/protocol, not on the content of the traffic.",
  "L7": "Application layer — a decision based on the actual content of the traffic, such as an HTTP host header, URL path, or cookie (used by Application Gateway, Front Door, and WAF).",
  "FQDN": "Fully Qualified Domain Name — a complete domain name (e.g. www.contoso.com), used e.g. in Azure Firewall application rules to allow/deny by name instead of by IP.",
  "Private peering": "An ExpressRoute peering type that gives private access to your VNets over the circuit.",
  "Microsoft peering": "An ExpressRoute peering type used to reach Microsoft 365 and other public PaaS service endpoints privately over the circuit, instead of over the internet.",
  "Private Link Service": "Lets you front your own service with a Standard Load Balancer and expose it to other VNets/tenants privately — the same mechanism Microsoft uses to offer its own PaaS services via Private Link.",
  "NVA": "Network Virtual Appliance — a third-party (or custom) firewall/router VM running in a VNet, not natively managed by the Azure platform.",
  "Gateway Load Balancer": "A Load Balancer SKU that transparently inserts a third-party NVA into the traffic path for inspection ('service chaining'), without the client or destination needing to know it's there.",
  "Effective Routes": "A Network Watcher diagnostic that shows the actual, merged routing table applied to a NIC — the result of system routes, UDRs, and BGP-learned routes combined.",
  "VMSS": "Virtual Machine Scale Set — a group of identical, autoscaling VMs, commonly placed behind a Load Balancer or Application Gateway.",
  "Local Network Gateway": "The Azure object that represents your on-prem VPN device: its public IP plus the address prefixes reachable behind it, so the Azure VPN Gateway knows how to route to it."
};

const DEEPDIVES = {
  "lb-tm": {
    title: "Load Balancer & Traffic Manager — how the settings fit together",
    sections: [
      {
        name: "Azure Load Balancer",
        flow: ["Client", "Frontend IP", "LB rule", "Health probe", "Backend pool"],
        intro: "Load Balancer sits in the data path at L4 — every packet actually passes through it. Build bottom-up: a rule can't reference a backend pool or probe that don't exist yet.",
        steps: [
          { title: "1. Backend pool", detail: "The VMs/VMSS instances (or IP-based targets) that will receive distributed traffic." },
          { title: "2. Health probe", detail: "Checks each backend pool member's health; unhealthy members stop receiving new connections from any rule that uses this probe." },
          { title: "3. Frontend IP configuration", detail: "The public or internal IP + port clients actually connect to." },
          { title: "4. Load balancing rule", detail: "Ties a frontend IP+port to a backend pool and a health probe, plus session persistence (source IP affinity) and idle timeout." },
          { title: "5. Optional — inbound NAT rule", detail: "Maps one frontend port straight to one specific backend instance/port (e.g. per-VM RDP/SSH), bypassing the load-balancing rule's distribution." },
          { title: "6. Optional — outbound rule", detail: "Explicitly defines SNAT behavior for outbound-only traffic from the backend pool, independent of any inbound rule." },
          { title: "7. Optional — Gateway Load Balancer chaining", detail: "Transparently inserts a third-party NVA into the path between frontend and backend pool for inspection." }
        ]
      },
      {
        name: "Traffic Manager",
        flow: ["Client DNS query", "TM profile", "Routing method", "Selected endpoint", "Direct connection"],
        intro: "Traffic Manager is DNS-only — it's never in the data path. It only decides which endpoint's address to hand back to the client's DNS resolver.",
        steps: [
          { title: "1. Endpoints", detail: "Register the actual regional deployments: Azure endpoints, external endpoints, or nested Traffic Manager profiles." },
          { title: "2. Endpoint monitoring", detail: "Traffic Manager health-checks every endpoint; unhealthy ones are automatically excluded from DNS answers." },
          { title: "3. Routing method", detail: "Priority (failover), Weighted, Performance (lowest latency), Geographic, MultiValue, or Subnet — determines which healthy endpoint gets returned for a given query." },
          { title: "4. DNS TTL", detail: "Clients resolve the Traffic Manager DNS name; a short TTL lets Traffic Manager react to endpoint failures faster, at the cost of more frequent DNS lookups." },
          { title: "5. Direct connection", detail: "Once resolved, the client connects straight to the returned endpoint — Traffic Manager itself never sees the actual traffic." }
        ]
      }
    ]
  },
  appgw: {
    title: "Application Gateway — how the settings fit together",
    sections: [
      {
        flow: ["Client", "Listener", "Routing rule", "HTTP settings", "Backend pool"],
        intro: "Application Gateway's settings form a dependency chain: each object references the one before it, so build them bottom-up — a routing rule can't point at HTTP settings or a listener that don't exist yet.",
        steps: [
          { title: "1. Backend pool", detail: "The eventual destination(s) for traffic: VMs, a VMSS, an App Service, or an external IP/FQDN. Create this first since every routing rule needs one to point to." },
          { title: "2. Health probe", detail: "Defines how the gateway checks a backend member's health (path, interval, healthy/unhealthy thresholds). A default probe is created automatically, but a custom probe must exist before HTTP settings can reference it." },
          { title: "3. HTTP settings", detail: "The glue between a routing rule and a backend pool: protocol/port to the backend, cookie-based session affinity, request timeout, and which health probe to use. Enabling HTTPS here (instead of HTTP) to the backend is what gives you end-to-end TLS." },
          { title: "4. Listener", detail: "The public/private entry point: protocol (HTTP/HTTPS), port, and hostname. A basic listener serves one site; a multi-site listener matches a specific Host header, so one gateway can serve many domains. An HTTPS listener is also where TLS termination happens, using an attached certificate." },
          { title: "5. Routing rule", detail: "Binds one listener to a backend target via HTTP settings. A basic rule always sends the listener's traffic to the same backend pool; a path-based rule adds a path map so /images/* and /api/* can each go to a different pool with its own HTTP settings and probe." },
          { title: "6. Optional — rewrite rule set", detail: "Attached to a routing rule to rewrite request/response headers or the URL itself before the request reaches the backend (or before the response reaches the client)." },
          { title: "7. Optional — WAF policy (WAF_v2 SKU)", detail: "Sits in front of the routing rule: every request is inspected against the OWASP CRS (and any custom rules) in Detection mode or Prevention mode before it's allowed to continue down the chain." }
        ]
      }
    ]
  },
  frontdoor: {
    title: "Front Door — how the settings fit together",
    sections: [
      {
        flow: ["Client", "Endpoint", "Route", "Origin group", "Origin"],
        intro: "Front Door mirrors Application Gateway's dependency chain, but globally at Microsoft's edge — origins and origin groups replace backend pools and HTTP settings.",
        steps: [
          { title: "1. Origin(s)", detail: "The actual backend(s): an App Service, a regional Application Gateway, storage, or any public/private endpoint (via Private Link)." },
          { title: "2. Origin group", detail: "Groups one or more origins with health probes plus priority/weight, so Front Door knows which are healthy and how to load-balance or fail over between them." },
          { title: "3. Endpoint", detail: "The public Front Door hostname (or custom domain) clients connect to; this is also where TLS termination happens." },
          { title: "4. Route", detail: "Binds an endpoint (+ optional path pattern) to an origin group, and configures caching, protocol, and URL rewrite/redirect for matching requests." },
          { title: "5. Optional — rules engine", detail: "Evaluated within a route to rewrite or redirect the request/response, e.g. force HTTPS or rewrite a path." },
          { title: "6. Optional — WAF policy", detail: "Associated with the endpoint's domains; every request is inspected against the OWASP CRS before it reaches a route." },
          { title: "7. Optional — end-to-end TLS to origin", detail: "Front Door terminates the client's TLS at the edge, then can re-encrypt when forwarding to the origin." }
        ]
      }
    ]
  }
};

const FIELD_LABELS = [
  ["who", "Who"], ["what", "What"], ["when", "When"],
  ["where", "Where"], ["why", "Why"], ["how", "How"]
];

const REVIEWED_KEY = "az700.reviewed";
const SUMMARY_KEY = "az700.summaryMode";
const THEME_KEY = "az700.theme";

function loadReviewed() {
  try { return new Set(JSON.parse(localStorage.getItem(REVIEWED_KEY) || "[]")); }
  catch { return new Set(); }
}
function saveReviewed(set) {
  localStorage.setItem(REVIEWED_KEY, JSON.stringify([...set]));
}

let reviewed = loadReviewed();
let summaryMode = localStorage.getItem(SUMMARY_KEY) === "1";

function totalComponents() {
  return DOMAINS.reduce((n, d) => n + d.components.length, 0);
}

function renderWeights() {
  const el = document.getElementById("weights");
  el.innerHTML = DOMAINS.map(d => {
    const pct = d.weightMax; // bar length uses the upper bound of the range
    return `
      <div class="weight-row">
        <span class="w-name">${d.name}</span>
        <div class="weight-track">
          <div class="weight-fill" style="width:${pct}%; background:var(${d.colorVar});"></div>
        </div>
        <span class="weight-pct">${d.weightMin}–${d.weightMax}%</span>
      </div>`;
  }).join("");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const TERM_REGEX = new RegExp(
  `(?<![A-Za-z0-9])(${Object.keys(GLOSSARY).sort((a, b) => b.length - a.length).map(escapeRegExp).join("|")})(?![A-Za-z0-9])`,
  "g"
);

function termSlug(term) {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function linkifyTerms(text) {
  return text.replace(TERM_REGEX, match => {
    const def = GLOSSARY[match].replace(/"/g, "&quot;");
    return `<button type="button" class="term-link" data-term="${match}" title="${def}">${match}</button>`;
  });
}

function fieldHtml(component, key, label) {
  const items = component[key];
  return `
    <div class="field">
      <span class="label">${label}</span>
      <ul>${items.map(i => `<li>${linkifyTerms(i)}</li>`).join("")}</ul>
    </div>`;
}

function cardHtml(domain, c) {
  const isReviewed = reviewed.has(c.id);
  return `
    <article class="card${summaryMode ? " summary-mode" : ""}${isReviewed ? " reviewed" : ""}" data-id="${c.id}" style="--domain-color:var(${domain.colorVar})">
      <div class="card-top">
        <h3>${c.title}</h3>
        <label class="reviewed-toggle">
          <input type="checkbox" data-reviewed="${c.id}" ${isReviewed ? "checked" : ""}>
          reviewed
        </label>
      </div>
      <p class="card-summary">${linkifyTerms(c.summary)}</p>
      ${DEEPDIVES[c.id] ? `<button type="button" class="btn-deepdive" data-deepdive="${c.id}">🔍 Configuration flow</button>` : ""}
      <div class="fields">
        ${FIELD_LABELS.map(([key, label]) => fieldHtml(c, key, label)).join("")}
      </div>
    </article>`;
}

function domainHtml(domain) {
  return `
    <section class="domain" data-domain="${domain.id}" style="--domain-color:var(${domain.colorVar})">
      <button class="domain-header" data-toggle="${domain.id}" aria-expanded="true">
        <span class="chevron">▾</span>
        <h2>${domain.name}</h2>
        <span class="domain-weight">${domain.weightMin}–${domain.weightMax}%</span>
      </button>
      <div class="domain-body">
        ${domain.components.map(c => cardHtml(domain, c)).join("")}
      </div>
    </section>`;
}

function render() {
  renderWeights();
  document.getElementById("domains").innerHTML =
    DOMAINS.map(domainHtml).join("") +
    `<p class="no-results" id="noResults">No components match your search.</p>`;
  updateProgress();
  wireCardEvents();
}

function updateProgress() {
  const total = totalComponents();
  const done = reviewed.size;
  document.getElementById("progressLabel").textContent = `${done} / ${total} reviewed`;
  document.getElementById("progressFill").style.width = total ? `${(done / total) * 100}%` : "0%";
}

function wireCardEvents() {
  document.querySelectorAll("[data-reviewed]").forEach(cb => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-reviewed");
      if (cb.checked) reviewed.add(id); else reviewed.delete(id);
      saveReviewed(reviewed);
      cb.closest(".card").classList.toggle("reviewed", cb.checked);
      updateProgress();
    });
  });

  document.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.closest(".domain");
      const collapsed = section.classList.toggle("collapsed");
      btn.setAttribute("aria-expanded", String(!collapsed));
    });
  });
}

function applySearch(term) {
  const q = term.trim().toLowerCase();
  let anyVisible = false;
  document.querySelectorAll(".domain").forEach(section => {
    let domainHasMatch = false;
    section.querySelectorAll(".card").forEach(card => {
      const text = card.textContent.toLowerCase();
      const match = !q || text.includes(q);
      card.classList.toggle("hidden", !match);
      if (match) domainHasMatch = true;
    });
    section.style.display = domainHasMatch ? "" : "none";
    if (domainHasMatch) anyVisible = true;
  });
  document.getElementById("noResults").style.display = anyVisible ? "none" : "block";
}

/* ---------- Dark mode ---------- */

function effectiveTheme() {
  const stored = document.documentElement.getAttribute("data-theme");
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeButton() {
  const btn = document.getElementById("themeToggle");
  const isDark = effectiveTheme() === "dark";
  btn.textContent = isDark ? "☀️ Light mode" : "🌙 Dark mode";
  btn.setAttribute("aria-pressed", String(isDark));
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) document.documentElement.setAttribute("data-theme", stored);
  updateThemeButton();

  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
    updateThemeButton();
  });
}

/* ---------- Quiz mode ---------- */

const quiz = { queue: [], index: 0, correct: 0, answered: 0 };

function allComponents() {
  return DOMAINS.flatMap(domain => domain.components.map(component => ({ domain, component })));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function openQuiz() {
  const unreviewedOnly = document.getElementById("quizUnreviewedOnly").checked;
  let pool = allComponents();
  if (unreviewedOnly) pool = pool.filter(({ component }) => !reviewed.has(component.id));

  quiz.queue = shuffle(pool);
  quiz.index = 0;
  quiz.correct = 0;
  quiz.answered = 0;

  document.getElementById("quizOverlay").hidden = false;
  renderQuizQuestion();
}

function closeQuiz() {
  document.getElementById("quizOverlay").hidden = true;
}

function updateQuizHeader() {
  const total = quiz.queue.length;
  const shown = Math.min(quiz.index + 1, total);
  document.getElementById("quizProgress").textContent = total ? `Card ${shown} / ${total}` : "";
  document.getElementById("quizScore").textContent = `${quiz.correct} / ${quiz.answered} correct`;
}

function renderQuizQuestion() {
  updateQuizHeader();
  const body = document.getElementById("quizBody");

  if (quiz.queue.length === 0) {
    body.innerHTML = `<p class="quiz-empty">Nothing to quiz — every component is already marked as reviewed. Uncheck "unreviewed only" to quiz everything.</p>`;
    return;
  }

  if (quiz.index >= quiz.queue.length) {
    renderQuizSummary();
    return;
  }

  const { domain, component } = quiz.queue[quiz.index];
  body.innerHTML = `
    <span class="quiz-domain" style="--domain-color:var(${domain.colorVar})">${domain.name}</span>
    <h3 class="quiz-title">${component.title}</h3>
    <p class="quiz-summary">Try to recall the Who / What / When / Where / Why / How, then reveal the answer.</p>
    <div class="quiz-actions">
      <button class="btn btn-reveal" id="quizReveal" type="button">Show answer</button>
    </div>`;

  document.getElementById("quizReveal").addEventListener("click", () => renderQuizAnswer(domain, component));
}

function renderQuizAnswer(domain, component) {
  const body = document.getElementById("quizBody");
  body.innerHTML = `
    <span class="quiz-domain" style="--domain-color:var(${domain.colorVar})">${domain.name}</span>
    <h3 class="quiz-title">${component.title}</h3>
    <div class="quiz-answer">
      ${FIELD_LABELS.map(([key, label]) => fieldHtml(component, key, label)).join("")}
    </div>
    <div class="quiz-actions">
      <button class="btn btn-incorrect" id="quizIncorrect" type="button">✕ Didn't know it</button>
      <button class="btn btn-correct" id="quizCorrect" type="button">✓ Knew it</button>
    </div>`;

  document.getElementById("quizCorrect").addEventListener("click", () => answerQuiz(component, true));
  document.getElementById("quizIncorrect").addEventListener("click", () => answerQuiz(component, false));
}

function answerQuiz(component, wasCorrect) {
  quiz.answered++;
  if (wasCorrect) {
    quiz.correct++;
    reviewed.add(component.id);
    saveReviewed(reviewed);
    updateProgress();
    const card = document.querySelector(`.card[data-id="${component.id}"]`);
    if (card) {
      card.classList.add("reviewed");
      const cb = card.querySelector("[data-reviewed]");
      if (cb) cb.checked = true;
    }
  }
  quiz.index++;
  renderQuizQuestion();
}

function renderQuizSummary() {
  const body = document.getElementById("quizBody");
  const pct = quiz.answered ? Math.round((quiz.correct / quiz.answered) * 100) : 0;
  body.innerHTML = `
    <div class="quiz-summary-screen">
      <div class="quiz-result-score">${quiz.correct} / ${quiz.answered}</div>
      <p>${pct}% correct this round.</p>
      <div class="quiz-actions">
        <button class="btn btn-reveal" id="quizRestart" type="button">Quiz again</button>
      </div>
    </div>`;
  document.getElementById("quizRestart").addEventListener("click", openQuiz);
}

function initQuiz() {
  document.getElementById("quizStart").addEventListener("click", openQuiz);
  document.getElementById("quizClose").addEventListener("click", closeQuiz);
  document.getElementById("quizOverlay").addEventListener("click", e => {
    if (e.target.id === "quizOverlay") closeQuiz();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !document.getElementById("quizOverlay").hidden) closeQuiz();
  });
}

/* ---------- Glossary ---------- */

function renderGlossaryList(filter) {
  const list = document.getElementById("glossaryList");
  const q = filter.trim().toLowerCase();
  const terms = Object.keys(GLOSSARY).sort((a, b) => a.localeCompare(b));
  const matches = terms.filter(t => !q || t.toLowerCase().includes(q) || GLOSSARY[t].toLowerCase().includes(q));

  if (!matches.length) {
    list.innerHTML = `<p class="glossary-empty">No terms match.</p>`;
    return;
  }

  list.innerHTML = matches.map(t => `
    <div class="glossary-entry" id="term-${termSlug(t)}">
      <p class="glossary-term">${t}</p>
      <p class="glossary-def">${GLOSSARY[t]}</p>
    </div>`).join("");
}

function openGlossary(term) {
  document.getElementById("glossarySearch").value = "";
  renderGlossaryList("");
  document.getElementById("glossaryOverlay").hidden = false;

  if (term) {
    requestAnimationFrame(() => {
      const el = document.getElementById(`term-${termSlug(term)}`);
      if (!el) return;
      el.scrollIntoView({ block: "center" });
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 1500);
    });
  }
}

function closeGlossary() {
  document.getElementById("glossaryOverlay").hidden = true;
}

function initGlossary() {
  document.getElementById("glossaryStart").addEventListener("click", () => openGlossary());
  document.getElementById("glossaryClose").addEventListener("click", closeGlossary);
  document.getElementById("glossaryOverlay").addEventListener("click", e => {
    if (e.target.id === "glossaryOverlay") closeGlossary();
  });
  document.getElementById("glossarySearch").addEventListener("input", e => renderGlossaryList(e.target.value));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !document.getElementById("glossaryOverlay").hidden) closeGlossary();
  });
  document.addEventListener("click", e => {
    const btn = e.target.closest(".term-link");
    if (btn) openGlossary(btn.dataset.term);
  });
}

/* ---------- Deep dive (configuration flow) ---------- */

function deepDiveSectionHtml(section) {
  const flowHtml = section.flow.map((node, i) => `
    ${i > 0 ? `<span class="flow-arrow">→</span>` : ""}
    <span class="flow-node">${node}</span>`).join("");

  const stepsHtml = section.steps.map(s => `
    <div class="deepdive-step">
      <p class="deepdive-step-title">${s.title}</p>
      <p class="deepdive-step-detail">${linkifyTerms(s.detail)}</p>
    </div>`).join("");

  return `
    <div class="deepdive-section">
      ${section.name ? `<h3 class="deepdive-section-title">${section.name}</h3>` : ""}
      <p class="deepdive-intro">${linkifyTerms(section.intro)}</p>
      <div class="flow-diagram">${flowHtml}</div>
      <div class="deepdive-steps">${stepsHtml}</div>
    </div>`;
}

function renderDeepDive(id) {
  const dive = DEEPDIVES[id];
  document.getElementById("deepdiveBody").innerHTML = dive.sections.map(deepDiveSectionHtml).join("");
}

function openDeepDive(id) {
  document.getElementById("deepdiveTitle").textContent = DEEPDIVES[id].title;
  renderDeepDive(id);
  document.getElementById("deepdiveOverlay").hidden = false;
}

function closeDeepDive() {
  document.getElementById("deepdiveOverlay").hidden = true;
}

function initDeepDive() {
  document.getElementById("deepdiveClose").addEventListener("click", closeDeepDive);
  document.getElementById("deepdiveOverlay").addEventListener("click", e => {
    if (e.target.id === "deepdiveOverlay") closeDeepDive();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !document.getElementById("deepdiveOverlay").hidden) closeDeepDive();
  });
  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn-deepdive");
    if (btn) openDeepDive(btn.dataset.deepdive);
  });
}

function init() {
  render();
  initTheme();
  initQuiz();
  initGlossary();
  initDeepDive();

  document.getElementById("search").addEventListener("input", e => applySearch(e.target.value));

  const summaryBtn = document.getElementById("summaryToggle");
  summaryBtn.setAttribute("aria-pressed", String(summaryMode));
  summaryBtn.addEventListener("click", () => {
    summaryMode = !summaryMode;
    localStorage.setItem(SUMMARY_KEY, summaryMode ? "1" : "0");
    summaryBtn.setAttribute("aria-pressed", String(summaryMode));
    document.querySelectorAll(".card").forEach(c => c.classList.toggle("summary-mode", summaryMode));
  });

  document.getElementById("expandAll").addEventListener("click", () => {
    document.querySelectorAll(".domain.collapsed").forEach(section => {
      section.classList.remove("collapsed");
      section.querySelector("[data-toggle]").setAttribute("aria-expanded", "true");
    });
  });

  if (summaryMode) {
    document.querySelectorAll(".card").forEach(c => c.classList.add("summary-mode"));
  }
}

document.addEventListener("DOMContentLoaded", init);
