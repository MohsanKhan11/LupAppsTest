import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

interface Board {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

interface Column {
  id: string;
  title: string;
  type: string;
}

interface ItemsWithColumns {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    type: string;
    value: string;
  }>;
}

export default class MondayAPIClient {
  private apiUrl = "https://api.monday.com/v2";
  private headers: Record<string, string>;
  constructor() {
    const token = process.env.MONDAY_API_TOKEN;
    if (!token) {
      throw new Error("MONDAY_API_TOKEN is required");
    }
    this.headers = {
      Authorization: token,
      "Content-Type": "application/json",
    };
  }

  private async makeRequest(
    query: string,
    variables?: Record<string, string>
  ): Promise<any> {
    try {
      const res = await axios.post(
        this.apiUrl,
        {
          query,
          variables: variables || {},
        },
        { headers: this.headers }
      );
      if (res.data.errors) {
        throw new Error(`GraphQL Error: ${res.data.errors}`);
      }
      return res.data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new Error(`Api request failed: ${err.message}`);
      }
      throw err;
    }
  }

  async fetchAllBoards(): Promise<Board[]> {
    const query = `
        query {
            boards {
                id
                name
            }
        }
    `;
    const data = await this.makeRequest(query);
    return data.boards as Board[];
  }

  async fetchBoardItems(boardId: string): Promise<Item[]> {
    const query = `
        query ($boardId: ID!) {
            boards(ids: [$boardId]) {
                items_page {
                    items {
                        id
                        name
                    }
                }
            }
        }
    `;
    const data = await this.makeRequest(query, { boardId });
    return data.boards[0]?.items_page.items || [];
  }

  async fetchBoardColumns(boardId: string): Promise<Column[]> {
    const query = `
        query ($boardId: ID!) {
            boards (ids: [$boardId]) {
                columns {
                    id
                    title
                    type
                }
            }
        }
    `;
    const data = await this.makeRequest(query, { boardId });
    return data.boards[0]?.columns || [];
  }

  async fetchConnectedBoardsData(boardId: string): Promise<boolean> {
    const columns = await this.fetchBoardColumns(boardId);
    const connectedBoardColumns = columns.filter(
      (col) => col.type === "connect_boards"
    );
    if (connectedBoardColumns.length === 0) {
      console.log("No connect_boards columns found in the board");
      return false;
    }
    console.log(`Found ${connectedBoardColumns.length} connect_boards columns`);
    connectedBoardColumns.forEach((col) => {
      console.log(`- Column: ${col.title} (ID: ${col.id})`);
    });
    const query = `
        query ($boardId: ID!) {
            boards (ids: [$boardId]) {
                items {
                    id
                    name
                    column_values {
                        id
                        type
                        value
                    }
                }
            }
        }
    `;
    const data = await this.makeRequest(query, { boardId });
    const items: ItemsWithColumns[] = data.boards[0].items || [];
    let foundConnectedItems = false;
    for (const item of items) {
      const connectedBoardValues = item.column_values.filter((cv) =>
        connectedBoardColumns.some((col) => col.id === cv.id)
      );
      if (connectedBoardValues.length > 0) {
        for (const columnValue of connectedBoardValues) {
          const columnTitle = connectedBoardColumns.find(
            (col) => col.id === columnValue.id
          )?.title;
          if (columnValue.value && columnValue.value !== "{}") {
            try {
              const parsedValue = JSON.parse(columnValue.value);
              console.log("parsedValue: " + parsedValue);
              return true;
            } catch (err) {
              throw new Error("Error occured while parsing column Value");
            }
          }
        }
      }
    }
    return false;
  }
}
