import MondayAPIClient from "./api";

async function main() {
  console.log("Starting");
  try {
    const client = new MondayAPIClient();
    // task1
    console.log("Task 1");
    const boards = await client.fetchAllBoards();
    if (boards.length === 0) {
      console.log("No boards found");
      return;
    }
    boards.forEach((board) => {
      console.log(`Board ID: ${board.id} | Board Name: ${board.name}`);
    });
    // task2
    console.log("Task 2");
    const firstBoard = boards[4];
    console.log(`Using board: ${firstBoard.name}`);
    const items = await client.fetchBoardItems(firstBoard.id);
    if (items.length === 0) {
      console.log("No items found in this board");
    } else {
      items.forEach((itm) => {
        console.log(`Item ID: ${itm.id} | Item Name: ${itm.name}`);
      });
    }
    // task3
    console.log("Task3");
    let foundConnectedData = false;
    for (const board of boards) {
      console.log(`\nChecking board: ${board.name}`);
      const hasConnectedData = await client.fetchConnectedBoardsData(board.id);
      if (hasConnectedData) {
        break;
      }
      client.fetchConnectedBoardsData(boards[1].id);
    }
    if (!foundConnectedData) {
      console.log("No Boards with connected items data found");
    }
  } catch (err) {
    console.log(`Error occured ${err}`);
  }
}

main();
