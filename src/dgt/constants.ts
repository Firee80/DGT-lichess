export const DGT_CMD_CLOCK_DISPLAY     = 0x1;
export const DGT_CMD_CLOCK_ICONS       = 0x2;
export const DGT_CMD_CLOCK_END         = 0x3;
export const DGT_CMD_CLOCK_BUTTON      = 0x8;
export const DGT_CMD_CLOCK_VERSION     = 0x9;
export const DGT_CMD_CLOCK_SET_AND_RUN= 0xa;
export const DGT_CMD_CLOCK_BEEP       = 0xb;
export const DGT_CMD_CLOCK_ASCII      = 0xc;
export const DGT_CLOCK_MESSAGE        = 0x2b;
export const DGT_SEND_CLOCK           = 0x41;   // returns DGT_MSG_BWTIME
export const DGT_SEND_BOARD           = 0x42;   // returns DGT_MSG_BOARD_DUMP
export const DGT_SEND_UPDATE          = 0x43;   // returns DGT_MSG_FIELD_UPDATE + DGT_MSG_BWTIME (continuous) (board in 'update' mode)
export const DGT_SEND_UPDATE_BOARD    = 0x44;   // returns DGT_MSG_FIELD_UPDATE (continuous)
export const DGT_RETURN_SERIAL        = 0x45;   // returns DGT_MSG_SERIALNR
export const DGT_RETURN_BUS_ADDRESS   = 0x46;   // returns DGT_MSG_BUSADRES
export const DGT_SEND_TRADEMARK       = 0x47;   // returns DGT_MSG_TRADEMARK
export const DGT_SEND_EE_MOVES        = 0x49;   // returns DGT_MSG_EE_MOVES
export const DGT_SEND_UPDATE_NICE     = 0x4b;   // returns DGT_MSG_FIELD_UPDATE + DGT_MSG_BWTIME (continuous) (board in 'update nice' mode)
export const DGT_SEND_BATTERY_STATUS  = 0x4c;   // returns battery status of bluetooth board
export const DGT_SEND_VERSION         = 0x4d;   // returns DGT_MSG_VERSION
export const DGT_SEND_BOARD_50B       = 0x50;   // returns DGT_MSG_BOARD_DUMP_50 (only black squares)
export const DGT_SCAN_50B             = 0x51;   // set board to scan only black squares (written into EEPROM)
export const DGT_SEND_BOARD_50W       = 0x52;   // returns DGT_MSG_BOARD_DUMP_50 (only white squares)
export const DGT_SCAN_50W             = 0x53;   // set board to scan only white squares (written into EEPROM)
export const DGT_SCAN_100             = 0x54;   // set board to scan all squares (written into EEPROM)
export const DGT_RETURN_LONG_SERIAL   = 0x55;   // returns DGT_LONG_SERIALNR
export const DGT_SET_LEDS             = 0x60;   // only for Revelation II board

// do not affect board modes
// DGT_SEND_CLOCK => returns DGT_MSG_BWTIME (clock information)
// DGT_SEND_BOARD => returns DGT_MSG_BOARD_DUMP (all pieces information)

// when in update mode, board continues sending DGT_SEND_UPDATE messages
// DGT_SEND_RESET => board to 'idle' mode
// DGT_SEND_UPDATE => board to 'update' mode (Fritz15 compatible)
// DGT_SEND_UPDATE_BOARD => board to 'update board' mode
// DGT_-SEND_UPDATE_NICE => board to 'update' mode but only clock times changed

// commands from PC to board (no response)
export const DGT_SEND_RESET           = 0x40;   // board to 'idle' mode
export const DGT_TO_BUS_MODE          = 0x4a;
export const DGT_START_BOOT_LOADER    = 0x4e;   // FC00 boot-loader code. Start FLIP now

// clock commands
export const DGT_COMMAND_CLOCK_DISPLAY     = [0x2b, 0xb, 0x3, 0x1];
export const DGT_COMMAND_CLOCK_CLEAR_ICONS = [0x2b, 0xb, 0x3, 0x2, 0x0, 0x0, 0x0, 0x0, 0x1, 0x0, 0x0, 0x0, 0x0];
export const DGT_COMMAND_CLOCK_END = [0x2b, 0x3, 0x3, 0x3, 0x0];   // clear text from clock
export const DGT_COMMAND_CLOCK_BUTTON = [0x2b, 0x3, 0x3, 0x8, 0x0];    // request current button pressed
export const DGT_COMMAND_CLOCK_VERSION = [0x2b, 0x03, 0x03, 0x09, 0x00];   // requests clock version
export const DGT_COMMAND_CLOCK_SET_AND_RUN = [0x2b, 0xa, 0x3, 0xa];   // set clock times
export const DGT_COMMAND_CLOCK_ASCII = [0x2b, 0xc, 0x3, 0xc];    // send 8 ascii characters to clock