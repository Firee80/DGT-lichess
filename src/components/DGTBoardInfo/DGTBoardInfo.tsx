import './DGTBoardInfo.css'
import { IBoardInfo } from "../../custom/useDGTBoard.ts";

export function DGTBoardInfo({ info }: { info?: IBoardInfo }) {
    if (!info) {
        return (
          <div className="dgt-board-info">
              DGT board offline
          </div>
        )
    }
    const { trademark, version, serial, capacity } = info;

    return (
      <div className="dgt-board-info">
          {trademark.map((item, index) => <div key={index}>{item}</div>)}
          <div>{version}</div>
          <div><span>Serial: </span><span>{serial}</span></div>
          <div><span>Battery: </span><span>{capacity} %</span></div>
      </div>
    );
}