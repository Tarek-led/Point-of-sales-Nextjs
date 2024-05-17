import React from "react";
import TableFeed from "@/components/table/table";
import { PageProps } from "@/types/paginations";
const page = async (props: PageProps) => {
  return (
    <div className="w-full h-full">
      <TableFeed {...props} />
    </div>
  );
};

export default page;
