import {useEffect, useState} from "react";
import classNames from "classnames";
import './Clock.css';

export function Clock ({ time, increment, play } : { time: number, increment: number, play: boolean }) {
    const [counter, setCounter] = useState<number>(0);

    useEffect(() => {
        if (!play) {
            setCounter(time);
            return;
        }

        setCounter(time);

        let id = setInterval(() => {
            setCounter(count => {
                if (count < 0) {
                    clearInterval(id);
                    return 0;
                } else {
                    return count - 1000;
                }
            })
        }, 1000)

        return () => {
            clearInterval(id);
        }
    }, [time, increment, play]);

    const seconds = counter > 0 ? Math.floor(counter / 1000) : 0;
    const minutes = counter > 0 ? Math.floor(seconds / 60) : 0;
    const leftSeconds = counter > 0 ? seconds - (minutes * 60) : 0;

    return (
      <div className={classNames('clock', {'running': play})}>
          {`${minutes.toString().padStart(2,'0')}:${leftSeconds.toString().padStart(2,'0')}`}
      </div>
    )
}