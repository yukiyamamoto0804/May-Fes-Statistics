import math
from itertools import combinations

import pandas as pd
from csv_data_saver import CsvDataSaver
from scipy.stats import chi2
from sklearn.linear_model import LinearRegression


class Analyze:
    def __init__(self, df_data):
        self.df_all_data = df_data
        self.median_data = {}
        self.mean_data = {}
        self.tests = ["test1", "test2", "test3"]
        self.df_data = {}
        for test in self.tests:
            self.median_data[test] = self.df_all_data[test].groupby("GroupId")["反応速度"].median().tolist()
            # 中央値の2倍以上のデータは外れ値と考える
            median_series = self.df_all_data[test].groupby("GroupId")["反応速度"].median()
            df = self.df_all_data[test].copy()
            df = df.merge(median_series.rename("中央値"), on="GroupId")
            self.df_data[test] = df[df["反応速度"] < df["中央値"] * 2]
            self.mean_data[test] = self.df_data[test].groupby("GroupId")["反応速度"].mean().tolist()
            # 各 groupid ごとの 反応速度 の平均を計算
            self.df_data[test]["group_means"] = self.df_data[test].groupby("GroupId")["反応速度"].transform("mean")
            # 平均との差を計算し、新しい列に追加
            self.df_data[test]["speed_diff_from_group_mean"] = (
                self.df_data[test]["反応速度"] - self.df_data[test]["group_means"]
            )
            self.df_data[test]["speed_diff_relative"] = self.df_data[test]["speed_diff_from_group_mean"] / self.df_data[test]["group_means"]

    def get_mean_reaction_speed(self):
        mean_reaction_speed = {}
        for test in self.tests:
            mean_reaction_speed[test] = round(sum(self.median_data[test]) / len(self.median_data[test]), 1)
        return mean_reaction_speed

    def get_distribution(self):
        results = {}
        for test in self.tests:
            results[test] = {}
            mu, sigma = self.normal_MLE(self.mean_data[test])
            # 分散として使いたい：差の2乗
            self.df_data[test]["squared_diff"] = self.df_data[test]["speed_diff_from_group_mean"] ** 2
            # groupid ごとに平均を集計
            group_stats = (
                self.df_data[test]
                .groupby("GroupId")
                .agg(
                    {
                        "group_means": "mean",  # X：groupごとの平均速度（たぶん全て同じ値だけどOK）
                        "squared_diff": "std",  # Y：group内の速度偏差² の平均（=分散っぽいもの）
                    }
                )
                .reset_index()
            )
            X = group_stats["group_means"].values.reshape(-1, 1)
            y = group_stats["squared_diff"].values
            coef, intercept, score = self.linear_regression(X, y)
            results[test]["mu"] = round(mu, 1)
            results[test]["sigma"] = round(sigma, 0)
            results[test]["coef"] = coef
            results[test]["intercept"] = intercept
            results[test]["score"] = score
        return results

    def likelihood_ratio_test(self):
        results = []
        for test_i, test_j in combinations(self.tests, 2):
            result = {}
            result["pair"] = [test_i, test_j]
            data_i = self.mean_data[test_i]
            data_j = self.mean_data[test_j]
            merged_data = []
            for x in data_i:
                merged_data.append(x)
            for y in data_j:
                merged_data.append(y)
            mu_i, sigma_i = self.normal_MLE(data_i)
            mu_j, sigma_j = self.normal_MLE(data_j)
            mu, sigma = self.normal_MLE(merged_data)
            l0 = self.likelihood_function_normal(data_i, mu_i, sigma_i) + self.likelihood_function_normal(
                data_j, mu_j, sigma_j
            )
            l1 = self.likelihood_function_normal(merged_data, mu, sigma)
            T = 2 * (l0 - l1)
            p_value = chi2.sf(T, 2)
            result["p_value"] = (p_value,)
            results.append(result)
        return results

    def stroop_test(self):
        result = {}
        test = "test2"
        red_values = self.df_data[test][self.df_data[test]["color"] == "red"]["speed_diff_relative"]
        blue_values = self.df_data[test][self.df_data[test]["color"] == "blue"]["speed_diff_relative"]
        p_value = self.likelihood_ratio_test_color(red_values, blue_values)
        result["test2_color"] = {
            "red_mean": sum(red_values) / len(red_values),
            "blue_mean": sum(blue_values) / len(blue_values),
            "p_value": p_value,
            "red_values": list(red_values),
            "blue_values": list(blue_values),
        }
        test = "test3"
        red_values = self.df_data[test][self.df_data[test]["text"] == "あか"]["speed_diff_relative"]
        blue_values = self.df_data[test][self.df_data[test]["text"] == "あお"]["speed_diff_relative"]
        p_value = self.likelihood_ratio_test_color(red_values, blue_values)
        result["test3_text"] = {
            "red_mean": sum(red_values) / len(red_values),
            "blue_mean": sum(blue_values) / len(blue_values),
            "p_value": p_value,
            "red_values": list(red_values),
            "blue_values": list(blue_values),
        }
        test = "test3"
        # 英語-ひらがな対応辞書
        color_text_map = {
            "red": "あか",
            "blue": "あお",
        }
        # 一致しているかどうかのフラグ列を追加
        self.df_data[test]["color_text_match"] = self.df_data[test].apply(
            lambda row: color_text_map.get(row["color"], None) == row["text"], axis=1
        )
        equal_group_values = self.df_data[test][self.df_data[test]["color_text_match"]]["speed_diff_relative"]
        different_group_values = self.df_data[test][~self.df_data[test]["color_text_match"]]["speed_diff_relative"]
        p_value = self.likelihood_ratio_test_color(equal_group_values, different_group_values)
        result["test3_stroop"] = {
            "equal_mean": sum(equal_group_values) / len(equal_group_values),
            "different_values": sum(different_group_values) / len(different_group_values),
            "p_value": p_value,
            "equal_group_values": list(equal_group_values),
            "different_group_values": list(different_group_values),
        }
        return result

    def likelihood_ratio_test_color(self, red_values, blue_values):
        merged_data = []
        for x in red_values:
            merged_data.append(x)
        for y in blue_values:
            merged_data.append(y)
        mu_r_, mu_b_, sigma_ = self.double_normal_MLE(red_values, blue_values)
        mu, sigma = self.normal_MLE(merged_data)
        l0 = self.likelihood_function_normal(red_values, mu_r_, sigma_) + self.likelihood_function_normal(
            blue_values, mu_b_, sigma_
        )
        l1 = self.likelihood_function_normal(merged_data, mu, sigma)
        T = 2 * (l0 - l1)
        print(T, l0, l1)
        p_value = chi2.sf(T, 1)
        return p_value

    @staticmethod
    def normal_MLE(data):
        mu = sum(data) / len(data)
        sigma = sum([(x - mu) ** 2 for x in data]) / len(data)
        return mu, sigma

    @staticmethod
    def double_normal_MLE(data1, data2):
        mu1 = sum(data1) / len(data1)
        mu2 = sum(data2) / len(data2)
        sigma = (sum([(x - mu1) ** 2 for x in data1]) + sum([(y - mu2) ** 2 for y in data2])) / (len(data1) + len(data2))
        return mu1, mu2, sigma

    @staticmethod
    def linear_regression(X, y):
        print(X)
        print(y)

        # 単回帰モデルの学習
        model = LinearRegression()
        model.fit(X, y)

        # 結果表示
        print("回帰係数（傾き）:", model.coef_[0])
        print("切片:", model.intercept_)
        print("決定係数 R^2:", model.score(X, y))
        return model.coef_[0], model.intercept_, model.score(X, y)

    @staticmethod
    def likelihood_function_normal(data, mu, sigma):
        ans = 0
        for x in data:
            ans -= 1 / 2 * math.log(2 * math.pi) + 1 / 2 * math.log(sigma) + 1 / 2 * (x - mu) ** 2 / sigma
        return ans


if __name__ == "__main__":
    spreadSheet = CsvDataSaver()
    df_data = spreadSheet.get_data()
    data = {}
    for key, df in df_data.items():
        data[key] = df["反応速度"].to_list()
    analysis_results = {}
    analyze = Analyze(df_data)
    analysis_results["mean_reaction_speed"] = analyze.get_mean_reaction_speed()
    analysis_results["distribution"] = analyze.get_distribution()
    analysis_results["likelihood_ratio_test"] = analyze.likelihood_ratio_test()
    analysis_results["stroop_test"] = analyze.stroop_test()
    # spreadSheet = CsvDataSaver()
    # df_data = spreadSheet.get_data()
    # analyze = Analyze(df_data)
    # print(analyze.get_mean_reaction_speed())
    # print(analyze.get_distribution())
    # print(analyze.likelihood_ratio_test())
    # print(analyze.stroop_test())
