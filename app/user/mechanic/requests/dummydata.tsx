interface RepairRequestItem {
    requestid: string;
    servicepackagename: string;
    requestdetailid: string;
    requesttype: string;
    customername: string;
    customerphone: string;
    stationid: string;
    requeststatus: string;
    createddate: string;
}
export const dummyRepairRequests: RepairRequestItem[] = [
    {
        requestid: "REQ001",
        servicepackagename: "Premium Package",
        requestdetailid: "RD12345",
        requesttype: "Installation",
        customername: "John Doe",
        customerphone: "123-456-7890",
        stationid: "ST001",
        requeststatus: "Pending",
        createddate: "2025-03-18",
    },
    {
        requestid: "REQ002",
        servicepackagename: "Standard Package",
        requestdetailid: "RD12346",
        requesttype: "Maintenance",
        customername: "Jane Smith",
        customerphone: "987-654-3210",
        stationid: "ST002",
        requeststatus: "In Progress",
        createddate: "2025-03-17",
    },
    {
        requestid: "REQ003",
        servicepackagename: "Basic Package",
        requestdetailid: "RD12347",
        requesttype: "Repair",
        customername: "Alice Johnson",
        customerphone: "555-666-7777",
        stationid: "ST003",
        requeststatus: "Completed",
        createddate: "2025-03-16",
    },
    {
        requestid: "REQ004",
        servicepackagename: "Deluxe Package",
        requestdetailid: "RD12348",
        requesttype: "Upgrade",
        customername: "Bob Brown",
        customerphone: "111-222-3333",
        stationid: "ST004",
        requeststatus: "Pending",
        createddate: "2025-03-15",
    },
    {
        requestid: "REQ005",
        servicepackagename: "VIP Package",
        requestdetailid: "RD12349",
        requesttype: "Consultation",
        customername: "Charlie Davis",
        customerphone: "444-555-6666",
        stationid: "ST005",
        requeststatus: "Cancelled",
        createddate: "2025-03-14",
    },
];
