import { LinearProgress, makeStyles, Typography } from "@material-ui/core";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import parse from 'html-react-parser/dist/html-react-parser';
import CoinInfo from "../components/CoinInfo";
import { SingleCoin } from "../config/api";
import { numberWithCommas } from "../components/CoinsTable";
import { CryptoState } from "../CryptoContext";

const CoinPage = () => {
  const { id } = useParams();
  const [coin, setCoin] = useState();
  const [prediction, setPrediction] = useState(null);

  const { currency, symbol } = CryptoState();

  const fetchCoin = useCallback(async () => {
    try {
      const { data } = await axios.get(SingleCoin(id));
      setCoin(data);
    } catch (error) {
      console.error("Error fetching coin:", error);
    }
  }, [id]);

  const fetchPrediction = useCallback(async () => {
    try {
      const response = await axios.post('http://localhost:5000/predict', {
        symbol: id
      });
      setPrediction(response.data);
    } catch (error) {
      console.error("Error fetching prediction:", error);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchCoin();
      await fetchPrediction();
    };
    fetchData();
  }, [fetchCoin, fetchPrediction]);

  const useStyles = makeStyles((theme) => ({
    container: {
      display: "flex",
      [theme.breakpoints.down("md")]: {
        flexDirection: "column",
        alignItems: "center",
      },
    },
    sidebar: {
      width: "30%",
      [theme.breakpoints.down("md")]: {
        width: "100%",
      },
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: 25,
      borderRight: "2px solid grey",
    },
    heading: {
      fontWeight: "bold",
      marginBottom: 20,
      fontFamily: "Montserrat",
    },
    description: {
      width: "100%",
      fontFamily: "Montserrat",
      padding: 25,
      paddingBottom: 15,
      paddingTop: 0,
      textAlign: "justify",
    },
    marketData: {
      alignSelf: "start",
      padding: 25,
      paddingTop: 10,
      width: "100%",
      [theme.breakpoints.down("md")]: {
        display: "flex",
        justifyContent: "space-around",
      },
      [theme.breakpoints.down("sm")]: {
        flexDirection: "column",
        alignItems: "center",
      },
      [theme.breakpoints.down("xs")]: {
        alignItems: "start",
      },
    },
    prediction: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "15px",
      border: "1px solid gold",
      borderRadius: "8px",
      marginTop: "20px",
    },
    predictionValue: {
      color: (props) => props > 0 ? "rgb(14, 203, 129)" : "red",
      fontFamily: "Montserrat",
      fontWeight: 500
    },
    signal: {
      padding: "8px 16px",
      borderRadius: "4px",
      fontWeight: "bold",
      textAlign: "center",
      backgroundColor: (props) => props > 2 ? "rgb(14, 203, 129)" : props < -2 ? "red" : "#ffd700",
      color: (props) => props > 2 || props < -2 ? "white" : "black",
      marginTop: "10px"
    }
  }));

  const classes = useStyles();

  const getDescription = () => {
    if (!coin?.description?.en) return "";
    const desc = coin.description.en;
    const firstSentence = desc.split(". ")[0] + ".";
    try {
      return parse(firstSentence);
    } catch (error) {
      console.error("Error parsing description:", error);
      return firstSentence;
    }
  };

  if (!coin) return <LinearProgress style={{ backgroundColor: "gold" }} />;

  return (
    <div className={classes.container}>
      <div className={classes.sidebar}>
        <img
          src={coin?.image.large}
          alt={coin?.name}
          height="200"
          style={{ marginBottom: 20 }}
        />
        <Typography variant="h3" className={classes.heading}>
          {coin?.name}
        </Typography>
        <Typography variant="subtitle1" className={classes.description}>
          {getDescription()}
        </Typography>
        <div className={classes.marketData}>
          <span style={{ display: "flex" }}>
            <Typography variant="h5" className={classes.heading}>
              Rank:
            </Typography>
            &nbsp; &nbsp;
            <Typography
              variant="h5"
              style={{
                fontFamily: "Montserrat",
              }}
            >
              {numberWithCommas(coin?.market_cap_rank)}
            </Typography>
          </span>

          <span style={{ display: "flex" }}>
            <Typography variant="h5" className={classes.heading}>
              Current Price:
            </Typography>
            &nbsp; &nbsp;
            <Typography
              variant="h5"
              style={{
                fontFamily: "Montserrat",
              }}
            >
              {symbol}{" "}
              {numberWithCommas(
                coin?.market_data.current_price[currency.toLowerCase()]
              )}
            </Typography>
          </span>
          <span style={{ display: "flex" }}>
            <Typography variant="h5" className={classes.heading}>
              Market Cap:
            </Typography>
            &nbsp; &nbsp;
            <Typography
              variant="h5"
              style={{
                fontFamily: "Montserrat",
              }}
            >
              {symbol}{" "}
              {numberWithCommas(
                coin?.market_data.market_cap[currency.toLowerCase()]
                  .toString()
                  .slice(0, -6)
              )}
              M
            </Typography>
          </span>
          
          {prediction && (
            <div className={classes.prediction}>
              <Typography variant="h5" className={classes.heading}>
                Price Prediction
              </Typography>
              <span style={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h6">
                  Predicted Price: {symbol} {numberWithCommas(prediction.predicted_price)}
                </Typography>
              </span>
              <span style={{ display: "flex", alignItems: "center" }}>
                <Typography 
                  variant="h6" 
                  className={classes.predictionValue}
                >
                  Expected Change: {prediction.predicted_change_percent > 0 ? "+" : ""}
                  {prediction.predicted_change_percent.toFixed(2)}%
                </Typography>
              </span>
              <Typography 
                variant="h6" 
                className={classes.signal}
                style={{ 
                  backgroundColor: prediction.predicted_change_percent > 2 
                    ? "rgb(14, 203, 129)" 
                    : prediction.predicted_change_percent < -2 
                      ? "red" 
                      : "#ffd700"
                }}
              >
                {prediction.predicted_change_percent > 2 
                  ? "Strong Buy Signal" 
                  : prediction.predicted_change_percent < -2 
                    ? "Strong Sell Signal"
                    : "Hold Position"}
              </Typography>
            </div>
          )}
        </div>
      </div>
      <CoinInfo coin={coin} />
    </div>
  );
};

export default CoinPage;
