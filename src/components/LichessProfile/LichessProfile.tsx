import '../DGTBoardInfo/DGTBoardInfo.css'
import { ILichessProfile } from "../../custom/useLichess.ts";
import './LichessProfile.css'

export function LichessProfile({ profile }: { profile?: ILichessProfile }) {
    if (!profile) {
        return (
          <div className="lichess-profile">
              Lichess offline
          </div>
        )
    }

    const {
        userName,
        firstName,
        lastName,
        rapidRating,
        blitzRating,
        bulletRating,
    } = profile;

    return (
      <div className="lichess-profile">
          <div>{userName}</div>
          <div>{firstName} {lastName}</div>
          <div>Rapid: {rapidRating}</div>
          <div>Blitz: {blitzRating}</div>
          <div>Bullet: {bulletRating}</div>
      </div>
    );
}